const fs = require('fs').promises;
const path = require('path');

async function initializeDataFile() {
  const filePath = path.join(process.cwd(), 'data', 'players.json');
  const defaultData = { players: {} };

  try {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    console.log('Successfully initialized players.json');
  } catch (error) {
    console.error('Error initializing data file:', error);
    process.exit(1);
  }
}

initializeDataFile(); 