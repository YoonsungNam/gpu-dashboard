import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=overview`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1500);
const occ = p.locator('#sec-occupancy');
// preview row counts (should be 10/10/10/10 where total>10, 23>10 so all 4 = 10)
const tables = occ.locator('div > table');
const counts = [];
for (let i = 0; i < await tables.count(); i++) counts.push(await tables.nth(i).locator('tr.gd-row').count());
console.log('preview rows:', counts.join(' / '), '(expect 10s)');
console.log('show-all rows present:', await occ.locator('button', { hasText: '전체' }).count());
await occ.screenshot({ path: 'design/shots/feedback/rank_preview.png' });
// click 학습 카드의 저활용 '전체 23건 보기' → resource lands on 학습 탭 + 저활용 필터
await occ.locator('button', { hasText: '전체 23건 보기' }).click();
await p.waitForTimeout(900);
const title = await p.locator('header').innerText();
const tabs = await p.locator('button[role="tab"][aria-selected="true"]').allInnerTexts();
const count = await p.locator('#res-toolbar span', { hasText: '/' }).first().innerText();
const fbtn = await p.locator('#res-toolbar button').first().innerText();
console.log('landed:', title.split('\n')[0], '| active tab:', tabs.join(','), '| count:', count, '| filter btn:', fbtn);
await p.screenshot({ path: 'design/shots/feedback/showall_landing.png', clip: { x: 224, y: 0, width: 1696, height: 400 } });
await b.close().catch(()=>{});
