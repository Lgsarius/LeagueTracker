import fs from 'fs/promises';
import path from 'path';

async function initializeDataFile() {
  const filePath = path.join(process.cwd(), 'data', 'players.json');
  const defaultData = { players: {} };

  try {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
  } catch (error) {
    console.error('Error initializing data file:', error);
  }
}

initializeDataFile(); 