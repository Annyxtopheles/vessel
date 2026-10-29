const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Mehedi\\.gemini\\antigravity\\brain\\0a0bb4c4-917d-41bc-806d-f142f6ee0b5a';
const LOCAL_DIR = path.join(__dirname, '..', 'screenshots');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));

if (!executablePath) {
  console.error('No browser executable found!');
  process.exit(1);
}

const prefix = process.argv[2] || 'before';

const targets = [
  { name: `inventory-${prefix}.png`, url: 'http://localhost:5173/?tab=inventory' },
  { name: `routine-${prefix}.png`, url: 'http://localhost:5173/?tab=routine' },
  { name: `character-${prefix}.png`, url: 'http://localhost:5173/?tab=character' },
];

async function run() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

  for (const t of targets) {
    console.log(`Capturing ${t.url} -> ${t.name}`);
    await page.goto(t.url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    
    const localPath = path.join(LOCAL_DIR, t.name);
    const artifactPath = path.join(ARTIFACT_DIR, t.name);
    
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`Saved to ${localPath} and ${artifactPath}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

run().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
