import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received update request body:', req.body);
    const { summonerName, playerInfo } = JSON.parse(req.body);
    console.log('Processing update for:', summonerName);
    
    const filePath = path.join(process.cwd(), 'data', 'players.json');
    console.log('Writing to file path:', filePath);
    
    // Read existing data
    let playersData;
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      playersData = JSON.parse(fileContent);
    } catch  {
      // If file doesn't exist or is invalid, start fresh
      playersData = { players: {} };
    }

    // Update the data
    playersData.players[summonerName] = {
      ...playerInfo,
      lastUpdated: new Date().toISOString()
    };

    // Write back to file
    await fs.writeFile(
      filePath,
      JSON.stringify(playersData, null, 2),
      'utf-8'
    );

    return res.status(200).json({ 
      message: 'Players data updated successfully',
      updatedPlayer: summonerName
    });
  } catch (error) {
    console.error('Error updating players.json:', error);
    return res.status(500).json({ 
      message: 'Failed to update players data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 