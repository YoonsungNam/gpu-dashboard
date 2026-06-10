import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots/audit_v2', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--force-color-profile=srgb'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 2 });

async function open(screen) {
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(1500);
  return p;
}
async function el(p, sel, out) {
  const e = await p.$(sel);
  if (!e) { console.log('MISS', sel, out); return; }
  await e.scrollIntoViewIfNeeded();
  await e.screenshot({ path: `design/shots/audit_v2/${out}.png` });
  console.log('shot', out);
}

// ---- overview ----
let p = await open('overview');
await el(p, 'header', 'r_ov_topbar');
await el(p, 'aside', 'r_ov_sidebar');
await el(p, '#sec-util', 'r_ov_util');
await el(p, '#sec-holdings', 'r_ov_holdings');
await el(p, '#sec-occupancy', 'r_ov_rank');
await el(p, '#sec-trend', 'r_ov_trend');
const rankRow = await p.$('#sec-occupancy tr.gd-row');
if (rankRow) { await rankRow.click(); await p.waitForTimeout(800); await el(p, '#sec-occupancy', 'r_ov_rank_expanded'); }
await p.close();

// ---- resource (추론) ----
p = await open('resource');
await el(p, '#res-toolbar', 'r_res_toolbar');
await el(p, '#res-table', 'r_res_table');
await el(p, '#res-footer', 'r_res_footer');
const row = await p.$('#res-table tr.gd-row');
if (row) { await row.click(); await p.waitForTimeout(800); await el(p, '#res-table', 'r_res_expanded'); }
await p.close();

// ---- resource (학습 tab) ----
p = await open('resource');
const trainTab = p.locator('button[role="tab"]', { hasText: '학습' }).first();
if (await trainTab.count()) { await trainTab.click(); await p.waitForTimeout(800); await el(p, '#res-table', 'r_res_train'); 
  const trow = await p.$('#res-table tr.gd-row');
  if (trow) { await trow.click(); await p.waitForTimeout(800); await el(p, '#res-table', 'r_res_train_expanded'); }
} else console.log('MISS train tab');
await p.close();

// ---- resource (등급 필터 popover) ----
p = await open('resource');
const filterBtn = p.locator('#res-toolbar button', { hasText: '등급 필터' }).first();
if (await filterBtn.count()) { await filterBtn.click(); await p.waitForTimeout(500);
  await p.screenshot({ path: 'design/shots/audit_v2/r_res_filter_open.png', clip: { x: 1100, y: 80, width: 820, height: 360 } });
  console.log('shot r_res_filter_open');
} else console.log('MISS filter btn');
await p.close();

// ---- tokens ----
p = await open('tokens');
await el(p, '#tok-toolbar', 'r_tok_toolbar');
await el(p, '#tok-table', 'r_tok_table');
const grow = await p.$('#tok-table tbody tr');
if (grow) { await grow.click(); await p.waitForTimeout(900); await el(p, '#tok-table', 'r_tok_expanded'); }
await p.close();

// ---- tokens modal (더보기) ----
p = await open('tokens');
const more = p.locator('text=더보기').first();
if (await more.count()) { await more.click(); await p.waitForTimeout(800);
  await p.screenshot({ path: 'design/shots/audit_v2/r_tok_modal.png' });
  console.log('shot r_tok_modal');
} else console.log('MISS 더보기');
await p.close();

await b.close().catch(()=>{});
