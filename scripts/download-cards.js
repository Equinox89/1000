import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];


// Create cards directory if it doesn't exist
const cardsDir = path.join(__dirname, '../public/cards');
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

// Download function
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Download all cards
async function downloadCards() {
  try {
    // Download card back
    console.log('Downloading card back...');
    await downloadFile(
      `${baseUrl}/back.svg`,
      path.join(cardsDir, 'back.svg')
    );

    // Download all card faces
    for (const suit of suits) {
      for (const rank of ranks) {
        const filename = `${rank}_of_${suit}.svg`;
        console.log(`Downloading ${filename}...`);
        await downloadFile(
          `${baseUrl}/${filename}`,
          path.join(cardsDir, filename)
        );
      }
    }

    console.log('All cards downloaded successfully!');
  } catch (error) {
    console.error('Error downloading cards:', error);
  }
}

downloadCards(); 