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
  await page.setViewport({ width: 1440, height: 960 });

  console.log('Navigating to http://localhost:5174/?tab=money');
  await page.goto('http://localhost:5174/?tab=money', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  let p1 = path.join(LOCAL_DIR, 'money-summary.png');
  let p2 = path.join(ARTIFACT_DIR, 'money-summary.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved: money-summary.png');

  // Click on 'Accounts' subtab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.innerText.includes('Accounts'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  p1 = path.join(LOCAL_DIR, 'money-accounts.png');
  p2 = path.join(ARTIFACT_DIR, 'money-accounts.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved: money-accounts.png');

  // Click on 'Transactions' subtab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.innerText.includes('Transactions'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  p1 = path.join(LOCAL_DIR, 'money-transactions.png');
  p2 = path.join(ARTIFACT_DIR, 'money-transactions.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved: money-transactions.png');

  // Click on 'Goals' subtab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.innerText.includes('Goals'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  p1 = path.join(LOCAL_DIR, 'money-goals.png');
  p2 = path.join(ARTIFACT_DIR, 'money-goals.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved: money-goals.png');

  // Click on 'Debts' subtab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.innerText.includes('Debts'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  p1 = path.join(LOCAL_DIR, 'money-debts.png');
  p2 = path.join(ARTIFACT_DIR, 'money-debts.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved: money-debts.png');

  await browser.close();
}
run().catch(console.error);
