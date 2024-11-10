import { NextApiRequest, NextApiResponse } from 'next';
import playersData from '@/data/players.json';

interface RankedQueueInfo {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface PlayerResponse {
  summoner: {
    id: string;
    accountId: string;
    puuid: string;
    name: string;
    profileIconId: number;
    summonerLevel: number;
  };
  rankedInfo: {
    leagueId: string;
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  }[];
  /* eslint-disable @typescript-eslint/no-explicit-any */
  recentMatches: (any | null)[];
}

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY is not defined in environment variables');
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
 /* eslint-disable-next-line padded-blocks */
const cache = new Map<string, { data: PlayerResponse; timestamp: number }>();

async function fetchWithRetry(url: string, options: RequestInit, retries = 5) {
  // Check cache first
  const cacheKey = url;
  const cachedData = cache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return new Response(JSON.stringify(cachedData.data), { status: 200 });
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        // Cache successful responses
        const data = await response.clone().json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return response;
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await wait(waitTime);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await wait(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries reached');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Summoner name is required' });
  }

  try {
    // Check if player exists in players.json
    const cachedPlayer = playersData.players[name as keyof typeof playersData.players];
    if (!cachedPlayer) {
      return res.status(404).json({
        message: 'Player not found in database',
        searchedName: name
      });
    }

    // Use cached data for basic info
    const playerData: PlayerResponse = {
      summoner: {
        id: cachedPlayer.id,
        accountId: cachedPlayer.accountId,
        puuid: cachedPlayer.puuid,
        name: `${cachedPlayer.gameName}#${cachedPlayer.tagLine}`,
        profileIconId: cachedPlayer.profileIconId,
        summonerLevel: cachedPlayer.summonerLevel,
      },
      rankedInfo: [], // Will be fetched from API
      recentMatches: [], // Will be fetched from API
    };

    // Get ranked data
    const rankedUrl = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${cachedPlayer.id}`;
    const rankedResponse = await fetchWithRetry(rankedUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY as string,
        'Accept': 'application/json'
      }
    });

    if (rankedResponse.ok) {
      const rankedData = await rankedResponse.json();
      playerData.rankedInfo = rankedData.map((queue: RankedQueueInfo) => ({
        leagueId: queue.leagueId,
        queueType: queue.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
        tier: queue.tier,
        rank: queue.rank,
        leaguePoints: queue.leaguePoints,
        wins: queue.wins,
        losses: queue.losses,
      }));
    }

    // Get recent matches
    const matchesUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${cachedPlayer.puuid}/ids?start=0&count=3`;
    const matchesResponse = await fetchWithRetry(matchesUrl, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY as string,
      }
    });

    if (matchesResponse.ok) {
      const matchIds = await matchesResponse.json();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      playerData.recentMatches = await Promise.all<any | null>(
        matchIds.map(async (matchId: string) => {
          const matchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`;
          try {
            const response = await fetchWithRetry(matchUrl, {
              headers: {
                'X-Riot-Token': RIOT_API_KEY as string,
              }
            });
            
            if (!response.ok) return null;
            return response.json();
          } catch (error) {
            console.warn(`Failed to fetch match ${matchId}:`, error);
            return null;
          }
        })
      );
    }

    return res.status(200).json(playerData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 