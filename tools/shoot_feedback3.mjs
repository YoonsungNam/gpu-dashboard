import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots/feedback', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--force-color-profile=srgb'] });
async function page(w = 1920, h = 1300) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  return ctx.newPage();
}
async function open(p, screen) {
  await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(1200);
}
const shot = (p, name, opts={}) => p.screenshot({ path: `design/shots/feedback/${name}.png`, ...opts }).then(()=>console.log('shot', name));

// 7) 우수(rows 0-9) expand → no reclaim; 저활용(rows 10-21) expand → reclaim
let p = await page(1920, 2600);
await open(p, 'overview');
const rows = p.locator('#sec-occupancy tr.gd-row');
console.log('left-card gd-rows:', await rows.count());
await rows.nth(0).click(); await p.waitForTimeout(500);   // 우수 1위
await rows.nth(10).click(); await p.waitForTimeout(500);  // 저활용 1위
const el = await p.$('#sec-occupancy');
if (el) { await el.screenshot({ path: 'design/shots/feedback/rank_expanded_both.png' }); console.log('shot rank_expanded_both'); }
await p.close();

// 8) resource 학습 tab — row vs detail consistency
p = await page();
await open(p, 'resource');
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click(); await p.waitForTimeout(600);
const row = p.locator('#res-table tr.gd-row').first();
const rowText = (await row.innerText()).replace(/\s+/g, ' ');
await row.click(); await p.waitForTimeout(600);
const detail = (await p.locator('#res-table').innerText()).replace(/\s+/g, ' ');
console.log('TRAIN ROW   :', rowText.slice(0, 150));
const i = detail.indexOf('활용 지표');
console.log('TRAIN DETAIL:', detail.slice(i, i + 230));
const el2 = await p.$('#res-table');
if (el2) { await el2.screenshot({ path: 'design/shots/feedback/res_train_expanded.png' }); console.log('shot res_train_expanded'); }
await p.close();

// 9) token narrow viewport
p = await page(1100, 1100);
await open(p, 'tokens');
await shot(p, 'token_narrow_1100');
await p.close();

// 10) holdings 9 models
p = await page();
await open(p, 'overview');
const h = await p.$('#sec-holdings');
if (h) { await h.scrollIntoViewIfNeeded(); await h.screenshot({ path: 'design/shots/feedback/holdings_9models.png' }); console.log('shot holdings_9models'); }
await p.close();
await b.close().catch(()=>{});
