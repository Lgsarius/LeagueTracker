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

    // Create directories if they don't exist
    const publicDir = path.join(process.cwd(), 'public');
    const dataDir = path.join(publicDir, 'data');
    const playersDir = path.join(dataDir, 'players');

    await fs.mkdir(publicDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(playersDir, { recursive: true });

    // Log the directory creation
    console.log('📁 Created directories:', {
      publicDir,
      dataDir,
      playersDir
    });

    // Fetch data from Riot API
    const accountData = await fetchAccountData(playerInfo);
    const summonerData = await fetchSummonerData(accountData.puuid);
    const rankedData = await fetchRankedData(summonerData.id);
    const matchDetails = await fetchMatchDetails(accountData.puuid);

    // Prepare player data
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
      recentMatches: matchDetails,
      lastUpdated: new Date().toISOString()
    };

    // Save to individual JSON file
    const playerFilePath = path.join(playersDir, `${playerInfo.gameName}.json`);
    await fs.writeFile(
      playerFilePath, 
      JSON.stringify(cleanPlayerData, null, 2)
    );
    console.log(`💾 Saved player data to:`, playerFilePath);

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