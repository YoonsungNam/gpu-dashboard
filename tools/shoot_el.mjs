/**
 * Element-focused screenshot: capture a single CSS selector so it stays legible
 * (the full-page shots get downsampled when reviewed). Usage:
 *   node tools/shoot_el.mjs <port> <screen> <selector> <outName>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const port = process.argv[2] || '5180';
const screen = process.argv[3] || 'overview';
const selector = process.argv[4] || 'body';
const out = process.argv[5] || 'el';

mkdirSync('design/shots', { recursive: true });
const b = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(() => {});
await p.waitForTimeout(1800);
const el = await p.$(selector);
if (el) {
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: `design/shots/${out}.png` });
  console.log('shot', out);
} else {
  console.log('selector not found:', selector);
}
await b.close().catch(() => {});
