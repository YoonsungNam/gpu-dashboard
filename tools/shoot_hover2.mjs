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
// hover the '384' segment label (H200 in the AIP row)
await p.locator('#sec-holdings >> text=384').first().hover();
await p.waitForTimeout(400);
await h.screenshot({ path: 'design/shots/feedback/holdings_hover.png' });
console.log('shot holdings_hover');
const tipText = await p.locator('div', { hasText: /장 \(/ }).last().innerText().catch(() => 'TOOLTIP NOT FOUND');
console.log('tooltip:', tipText.replace(/\s+/g, ' ').slice(0, 80));
await b.close().catch(()=>{});
