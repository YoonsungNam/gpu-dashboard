/**
 * Screenshot harness: render each screen in headless Chromium at Figma frame
 * width and save PNGs so we can visually diff against design/GPU_*.png.
 *
 * Usage: node tools/shoot.mjs <port> [screen1 screen2 ...]
 * Requires a running dev/preview server on <port>. Relaunches the browser per
 * target so one crash can't abort the rest.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const port = process.argv[2] || '5180';
const screens = process.argv.slice(3);
const targets = screens.length ? screens : ['overview', 'resource'];

mkdirSync('design/shots', { recursive: true });

for (const name of targets) {
  let browser;
  try {
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
    });
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1400 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${port}/?screen=${name}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1800); // webfont + Recharts settle
    await page.screenshot({ path: `design/shots/${name}.png`, fullPage: true });
    console.log('shot', name);
  } catch (e) {
    console.log('FAIL', name, e.message.split('\n')[0]);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
