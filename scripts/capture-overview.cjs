const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Mehedi\\.gemini\\antigravity\\brain\\0a0bb4c4-917d-41bc-806d-f142f6ee0b5a';
const LOCAL_DIR = path.join(__dirname, '..', 'screenshots');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });

  console.log('Navigating to http://localhost:5174/?tab=overview');
  await page.goto('http://localhost:5174/?tab=overview', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  let p1 = path.join(LOCAL_DIR, 'overview-editorial.png');
  let p2 = path.join(ARTIFACT_DIR, 'overview-editorial.png');
  await page.screenshot({ path: p1, fullPage: true });
  fs.copyFileSync(p1, p2);
  console.log('Saved: overview-editorial.png (fullpage)');

  await browser.close();
}
run().catch(console.error);
