import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=overview`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1500);

const occText = async () => (await p.locator('#sec-occupancy').innerText()).replace(/\s+/g,' ');

// 0) 새 정책 캡션
let t = await occText();
console.log('추론 우수 캡션 ≥40%:', t.includes('GPU Util ≥ 40%'));
console.log('학습 우수 캡션 50&80:', t.includes('GPU Util ≥ 50% and Slot Util ≥ 80%'));
console.log('추론 저활용 생산시스템:', t.includes('생산시스템 연계: GPU Util < 5% or Slot Util ≤ 75%'));

// 1) 필터 변경: 기간 7일 + 사업부 AI센터 + 과제구분 전략
await p.locator('header select').nth(0).selectOption({ label: '최근 7일' });
await p.locator('header select').nth(1).selectOption({ label: 'AI센터' });
await p.locator('header select').nth(2).selectOption({ label: '전략' });
await p.waitForTimeout(800);

const trendCap = await p.locator('#sec-trend').innerText();
console.log('사용추이 캡션 follows 기간:', trendCap.includes('최근 7일'));
const dateTicks = (trendCap.match(/05-\d\d/g) || []).length;
console.log('trend date ticks (7일 window):', dateTicks);

t = await occText();
const ovProjects = [...t.matchAll(/([\d,]+) Projects/g)].map(m=>m[1]);
const ovCounts = [...t.matchAll(/(우수 활용 과제|저활용 과제)\s+(\d+)/g)].map(m=>`${m[1].includes('우수')?'G':'A'}${m[2]}`);
console.log('OV (7일/AI센터/전략) Projects:', ovProjects.join('/'), 'counts:', ovCounts.join(' '));

// 2) 자원 페이지 — 같은 필터로 자동 갱신되는지
await p.locator('aside').getByText('GPU 활용 현황').click();
await p.waitForTimeout(800);
const tabs = await p.locator('button[role="tab"]').allInnerTexts();
console.log('RES tabs (must == OV Projects):', tabs.join(' | '));
// 우수 필터 총계 == OV 우수 count?
const tb = p.locator('#res-toolbar');
await tb.locator('button', { hasText: /등급/ }).first().click(); await p.waitForTimeout(250);
await tb.getByText('우수', { exact: true }).last().click(); await p.waitForTimeout(450);
console.log('RES 추론 우수 total:', await tb.locator('span', { hasText: '/' }).first().innerText());

// 3) 토큰 페이지 — division 필터 반영 + 파생 KPI
await p.locator('aside').getByText('토큰 활용 현황').click();
await p.waitForTimeout(800);
const kpi = (await p.locator('#tok-toolbar').innerText()).replace(/\s+/g,' ');
console.log('TOKEN KPI (AI센터 only):', kpi.slice(0, 80));
const table = (await p.locator('#tok-table').innerText()).replace(/\s+/g,' ');
const metas = [...table.matchAll(/서비스 (\d+)개/g)].map(m=>+m[1]);
console.log('TOKEN group metas sum:', metas.reduce((a,b)=>a+b,0), '(must == KPI 서비스)');
const divisions = [...table.matchAll(/(AI센터|DX|SAIT|메모리|S\.LSI|글로벌)/g)].map(m=>m[1]);
console.log('TOKEN visible divisions:', [...new Set(divisions)].join(','));
await b.close().catch(()=>{});
