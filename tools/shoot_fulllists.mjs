import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=overview`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1800);
// row counts per list (4 DataTables top-level in #sec-occupancy; nested unit tables have no .gd-row)
const occ = p.locator('#sec-occupancy');
const headerCounts = [...(await occ.innerText()).matchAll(/(우수 활용 과제|저활용 과제)\s+(\d+)/g)].map(m => `${m[1]}=${m[2]}`);
console.log('headers:', headerCounts.join(' | '));
const tables = occ.locator('div > table'); // top-level tables inside scrollers
const n = await tables.count();
const rowCounts = [];
for (let i = 0; i < n; i++) rowCounts.push(await tables.nth(i).locator('tr.gd-row').count());
console.log('table gd-row counts:', rowCounts.join(' / '));
// scroll the first 우수 table to bottom — last row should be reachable
const firstScroller = occ.locator('div').filter({ has: tables.first() }).first();
await tables.first().locator('tr.gd-row').last().scrollIntoViewIfNeeded();
console.log('scrolled to last 우수 row: ok');
await b.close().catch(()=>{});
