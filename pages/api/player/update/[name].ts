import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWithRetry } from '@/utils/api';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Invalid player name' });
    }

    const playerInfo = req.body;
    if (!playerInfo?.gameName || !playerInfo?.tagLine) {
      console.error('Invalid player info received:', playerInfo);
      return res.status(400).json({ 
        message: 'Invalid player info', 
        received: playerInfo 
      });
    }

    // Fetch all required data first
    const accountData = await fetchAccountData(playerInfo);
    const summonerData = await fetchSummonerData(accountData.puuid);
    const rankedData = await fetchRankedData(summonerData.id);
    const matchDetails = await fetchMatchDetails(accountData.puuid);
    // Read existing data file
    const dataPath = path.join(process.cwd(), 'data', 'players.json');
    interface PlayerData {
      players: {
        [key: string]: {
          recentMatches?: any[];
          // ... other player properties can be defined here if needed
        };
      };
    }

    let playerData: PlayerData = { players: {} };
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      playerData = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist or is invalid, use empty data object
    }

    // Prepare clean player data
    const existingPlayer = playerData.players[playerInfo.gameName];
    const existingMatches = existingPlayer?.recentMatches || [];
    
    // Add this interface before the merge logic
    interface MatchInfo {
      info: {
        gameCreation: number;
        gameDuration: number;
        gameMode: string;
        participants: any[];
      }
    }

    // Convert new matches to the clean format
    const newMatches = matchDetails.filter(Boolean).map(match => ({
      info: {
        gameCreation: match.info.gameCreation,
        gameDuration: match.info.gameDuration,
        gameMode: match.info.gameMode,
        participants: match.info.participants.map((p: any) => ({
          puuid: p.puuid,
          championId: p.championId,
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
        }))
      }
    }));
    
    // Merge matches, avoiding duplicates by gameCreation time
    const mergedMatches = [...newMatches];
    existingMatches.forEach((existingMatch: MatchInfo) => {
      if (!mergedMatches.some(newMatch => 
        newMatch.info.gameCreation === existingMatch.info.gameCreation
      )) {
        // Ensure existingMatch has all required properties before pushing
        if (existingMatch?.info?.gameCreation && 
            existingMatch?.info?.gameDuration && 
            existingMatch?.info?.gameMode && 
            existingMatch?.info?.participants) {
          mergedMatches.push(existingMatch as {
            info: {
              gameCreation: number;
              gameDuration: number;
              gameMode: string;
              participants: any[];
            }
          });
        }
      }
    });
    
    // Sort matches by gameCreation (newest first) and limit to 20 matches
    const sortedMatches = mergedMatches
      .sort((a, b) => b.info.gameCreation - a.info.gameCreation)
      .slice(0, 20);
    
    const cleanPlayerData = {
      gameName: playerInfo.gameName,
      tagLine: playerInfo.tagLine,
      puuid: accountData.puuid,
      id: summonerData.id,
      accountId: summonerData.accountId,
      profileIconId: summonerData.profileIconId,
      summonerLevel: summonerData.summonerLevel,
      rankedInfo: rankedData.map((queue: any) => ({
        leagueId: queue.leagueId,
        queueType: queue.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
        tier: queue.tier,
        rank: queue.rank,
        leaguePoints: queue.leaguePoints,
        wins: queue.wins,
        losses: queue.losses,
      })),
      recentMatches: sortedMatches,
      lastUpdated: new Date().toISOString()
    };

    // Update players.json with clean data
    const filePath = path.join(process.cwd(), 'data', 'players.json');
    let data;
    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(fileData);
    } catch {
      data = { players: {} };
    }
    
    data.players[playerInfo.gameName] = cleanPlayerData;

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    // Return the cleaned data
    return res.status(200).json({
      puuid: accountData.puuid,
      summoner: {
        id: summonerData.id,
        accountId: summonerData.accountId,
        puuid: accountData.puuid,
        name: `${playerInfo.gameName}#${playerInfo.tagLine}`,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
      },
      rankedInfo: cleanPlayerData.rankedInfo,
      recentMatches: cleanPlayerData.recentMatches
    });

  } catch (error) {
    console.error('Error updating player:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchAccountData(playerInfo: any) {
  const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(playerInfo.gameName)}/${encodeURIComponent(playerInfo.tagLine)}`;
  const response = await fetchWithRetry(accountUrl);
  if (!response.ok) throw new Error('Failed to fetch account data');
  return response.json();
}

async function fetchSummonerData(puuid: string) {
  const summonerUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const response = await fetchWithRetry(summonerUrl);
  if (!response.ok) throw new Error('Failed to fetch summoner data');
  return response.json();
}

async function fetchRankedData(summonerId: string) {
  const rankedUrl = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  const response = await fetchWithRetry(rankedUrl);
  return response.ok ? response.json() : [];
}

async function fetchMatchDetails(puuid: string) {
  const matchesUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=3`;
  const matchesResponse = await fetchWithRetry(matchesUrl);
  if (!matchesResponse.ok) return [];
  
  const matchIds = await matchesResponse.json();
  return Promise.all(
    matchIds.map(async (matchId: string) => {
      try {
        const response = await fetchWithRetry(
          `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`
        );
        return response.ok ? response.json() : null;
      } catch (error) {
        console.warn(`Failed to fetch match ${matchId}:`, error);
        return null;
      }
    })
  );
} 