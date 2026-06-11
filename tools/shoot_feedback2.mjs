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
let p = await page();
await open(p, 'overview');
// 4) metric defs modal
await p.getByRole('button', { name: /지표 정의/ }).click(); await p.waitForTimeout(400);
await shot(p, 'metric_defs_modal');
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
// 5) section collapse (§1 marker)
await p.locator('#sec-util button[aria-expanded]').first().click(); await p.waitForTimeout(300);
await shot(p, 'section_collapsed', { clip: { x: 224, y: 56, width: 1696, height: 500 } });
await p.locator('#sec-util button[aria-expanded]').first().click(); await p.waitForTimeout(300);
// 6) rank tables scroll + 우수 expand (no reclaim) / 저활용 expand (reclaim)
const occ = p.locator('#sec-occupancy');
await occ.scrollIntoViewIfNeeded();
await shot(p, 'rank_scroll', { clip: { x: 224, y: 0, width: 1696, height: 1300 } });
await p.close();

// 7) overview 저활용 expand shows reclaim, 우수 expand doesn't
p = await page(1920, 2400);
await open(p, 'overview');
const tables = p.locator('#sec-occupancy table');
await tables.nth(0).locator('tr.gd-row').first().click(); await p.waitForTimeout(500);
await tables.nth(1).locator('tr.gd-row').first().click(); await p.waitForTimeout(500);
const el = await p.$('#sec-occupancy');
if (el) { await el.screenshot({ path: 'design/shots/feedback/rank_expanded_both.png' }); console.log('shot rank_expanded_both'); }
await p.close();

// 8) resource 학습 tab expand — value consistency check (print row vs detail values)
p = await page();
await open(p, 'resource');
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click(); await p.waitForTimeout(600);
const row = p.locator('#res-table tr.gd-row').first();
const rowText = await row.innerText();
await row.click(); await p.waitForTimeout(600);
const detail = await p.locator('#res-table').innerText();
console.log('TRAIN ROW:', rowText.replace(/\s+/g, ' ').slice(0, 160));
const kpiIdx = detail.indexOf('활용 지표');
console.log('TRAIN DETAIL:', detail.slice(kpiIdx, kpiIdx + 220).replace(/\s+/g, ' '));
const el2 = await p.$('#res-table');
if (el2) { await el2.screenshot({ path: 'design/shots/feedback/res_train_expanded.png' }); console.log('shot res_train_expanded'); }
await p.close();

// 9) token narrow viewport — overlap check
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
