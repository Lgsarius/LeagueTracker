import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWithRetry } from '@/utils/api';
import path from 'path';
import fs from 'fs/promises';
/* eslint-disable */
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
        queueId: number | null;
      }
    }

    // Convert new matches to the clean format
    const newMatches = matchDetails.filter(Boolean).map(match => ({
      info: {
        gameCreation: match.info.gameCreation,
        gameDuration: match.info.gameDuration,
        gameMode: match.info.gameMode,
        queueId: match.info.queueId,
        participants: match.info.participants.map((p: any) => ({
          puuid: p.puuid,
          championId: p.championId,
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
          pings: {
            missing: p.enemyMissingPings || 0,
            danger: p.dangerPings || 0,
            command: p.commandPings || 0,
            vision: p.enemyVisionPings || 0,
            getBack: p.getBackPings || 0,
            hold: p.holdPings || 0,
            needVision: p.needVisionPings || 0,
            onMyWay: p.onMyWayPings || 0,
            push: p.pushPings || 0,
            retreat: p.retreatPings || 0,
            visionCleared: p.visionClearedPings || 0,
          }
        }))
      }
    }));
    
    // Add type safety for match data
    interface Match {
      info: {
        gameCreation: number;
        gameDuration: number;
        gameMode: string;
        queueId: number | null;
        participants: Array<{
          puuid: string;
          championId: number;
          championName: string;
          kills: number;
          deaths: number;
          assists: number;
          win: boolean;
          pings: Record<string, number>;
        }>;
      };
    }

    // Modify the mergedMatches handling to ensure valid data
    const mergedMatches = newMatches.filter((match): match is Match => {
      return Boolean(
        match?.info?.gameCreation &&
        match?.info?.gameDuration &&
        match?.info?.gameMode &&
        Array.isArray(match?.info?.participants)
      );
    });

    existingMatches.forEach((existingMatch: MatchInfo) => {
      if (!mergedMatches.some(newMatch => 
        newMatch.info.gameCreation === existingMatch.info.gameCreation
      )) {
        // Validate existing match structure before adding
        if (
          existingMatch?.info?.gameCreation &&
          existingMatch?.info?.gameDuration &&
          existingMatch?.info?.gameMode &&
          Array.isArray(existingMatch?.info?.participants)
        ) {
          mergedMatches.push({
            info: {
              ...existingMatch.info,
              queueId: existingMatch.info.queueId ?? null,
              participants: existingMatch.info.participants || []
            }
          });
        }
      }
    });
    // Sort and limit to 20 most recent matches
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

    // Modify the file operations section
    const filePath = path.join(process.cwd(), 'data', 'players.json');

    // Initialize with valid default structure
    const defaultData = { players: {} };

    // Read existing data or create new
    async function readOrCreatePlayersFile() {
      try {
        // Check if file exists
        try {
          await fs.access(filePath);
        } catch {
          // File doesn't exist, create it with default structure
          await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
          return defaultData;
        }

        // File exists, try to read it
        const fileContent = await fs.readFile(filePath, 'utf8');
        if (!fileContent.trim()) {
          // File is empty, initialize with default structure
          await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
          return defaultData;
        }

        // Parse existing content
        const parsed = JSON.parse(fileContent);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure');
        }

        // Ensure players property exists
        return {
          players: { ...((parsed as any).players || {}) }
        };
      } catch (error) {
        console.error('Error reading players file:', error);
        // Return default structure on any error
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        return defaultData;
      }
    }

    // Replace the existing file reading code with this:
    const data = await readOrCreatePlayersFile();
    data.players[playerInfo.gameName] = cleanPlayerData;

    // Modify the file writing section
    try {
      const jsonString = JSON.stringify(data, null, 2);
      // Validate the JSON string before writing
      JSON.parse(jsonString); // This will throw if the JSON is invalid
      
      // Write to temporary file first
      const tempPath = `${filePath}.temp`;
      await fs.writeFile(tempPath, jsonString);
      
      // Verify the temporary file is valid
      const verificationContent = await fs.readFile(tempPath, 'utf8');
      JSON.parse(verificationContent); // Verify JSON is valid
      
      // If verification passes, rename temp file to actual file
      await fs.rename(tempPath, filePath);
    } catch (error) {
      console.error('Error preparing or writing JSON:', error);
      // Restore default structure if something goes wrong
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
      throw new Error('Failed to save valid JSON data');
    }

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
  console.log('Starting fetchMatchDetails with PUUID:', puuid);
  
  // Use fetchWithRetry without custom headers - let it use the default RIOT_API_KEY
  const matchesUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`;
  console.log('Fetching matches from:', matchesUrl);
  
  const matchesResponse = await fetchWithRetry(matchesUrl);
  
  console.log('Matches response status:', matchesResponse.status);
  if (!matchesResponse.ok) {
    const errorText = await matchesResponse.text();
    console.error('Failed to fetch match IDs:', errorText);
    return [];
  }
  
  const matchIds = await matchesResponse.json();
  console.log('Match IDs retrieved:', matchIds);
  
  return Promise.all(
    matchIds.map(async (matchId: string) => {
      try {
        const matchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        console.log('Fetching match details:', matchId);
        
        // Use fetchWithRetry without custom headers here as well
        const response = await fetchWithRetry(matchUrl);
        
        console.log(`Match ${matchId} response status:`, response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch match ${matchId}:`, errorText);
          return null;
        }
        
        return response.json();
      } catch (error) {
        console.error(`Error fetching match ${matchId}:`, error);
        return null;
      }
    })
  );
} 