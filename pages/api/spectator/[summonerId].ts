import { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { summonerId } = req.query;

  if (!summonerId || typeof summonerId !== 'string') {
    return res.status(400).json({ message: 'Summoner ID is required' });
  }

  try {
    const response = await fetch(
      `https://euw1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY as string,
        },
      }
    );

    if (response.status === 404) {
      return res.status(404).json({ message: 'Player not in game' });
    }

    if (!response.ok) {
      throw new Error(`Riot API returned ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Spectator API Error:', error);
    return res.status(500).json({ message: 'Failed to check game status' });
  }
} 