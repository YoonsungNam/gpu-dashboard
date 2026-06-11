import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=overview`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1500);
const h = p.locator('#sec-holdings');
await h.scrollIntoViewIfNeeded();
// hover the 2nd segment of the first bar (A100-family hue)
const bar = h.locator('div[style*="ECF1F5"]').first();
const seg = bar.locator(':scope > div').nth(1);
await seg.hover({ position: { x: 60, y: 11 } });
await p.waitForTimeout(400);
await h.screenshot({ path: 'design/shots/feedback/holdings_hover.png' });
console.log('shot holdings_hover');
await b.close().catch(()=>{});
