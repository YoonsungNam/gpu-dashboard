import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 2400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=tokens`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1500);

// KPI strip values
const kpi = (await p.locator('#tok-toolbar').innerText()).replace(/\s+/g,' ');
console.log('KPI:', kpi.slice(0, 90));

// table-level: group count + per-group service metas + 더보기 counts
const table = (await p.locator('#tok-table').innerText()).replace(/\s+/g,' ');
const metas = [...table.matchAll(/서비스 (\d+)개/g)].map(m => +m[1]);
const more = [...table.matchAll(/(\d+)개 서비스 더보기/g)].map(m => +m[1]);
const groupRows = await p.locator('#tok-table tbody tr').filter({ has: p.locator('text=/^\\d+$/') }).count();
console.log('group metas:', metas.join('+'), '=', metas.reduce((a,b)=>a+b,0));
console.log('더보기 counts:', more.join(', '));

// I:O format check (N:1)
const ios = [...table.matchAll(/(\d+(?:\.\d+)?):1/g)].slice(0,5).map(m=>m[0]);
console.log('I:O samples:', ios.join(' | '));

// sorting: click 일평균 합계 header → first group should be the largest
const before = (await p.locator('#tok-table tbody tr').first().innerText()).replace(/\s+/g,' ').slice(0,60);
await p.locator('#tok-table thead th', { hasText: '일평균 합계' }).click();
await p.waitForTimeout(400);
const after = (await p.locator('#tok-table tbody tr').first().innerText()).replace(/\s+/g,' ').slice(0,60);
console.log('sort 합계 desc — first row before:', before);
console.log('sort 합계 desc — first row after :', after);
await p.screenshot({ path: 'design/shots/feedback/token_consistent.png', clip: { x: 224, y: 56, width: 1696, height: 700 } });
await b.close().catch(()=>{});
