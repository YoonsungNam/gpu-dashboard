import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
const screen = process.argv[3] || 'overview';
// pairs of [selector, outName]
const targets = JSON.parse(process.argv[4]);
mkdirSync('design/shots', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--force-color-profile=srgb'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1800);
for (const [sel, out] of targets) {
  const el = await p.$(sel);
  if (!el) { console.log('MISS', sel, '->', out); continue; }
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: `design/shots/${out}.png` });
  console.log('shot', out);
}
await b.close().catch(()=>{});
