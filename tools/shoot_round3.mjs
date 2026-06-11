import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots/feedback', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const open = async (s) => { await p.goto(`http://localhost:${port}/?screen=${s}`, { waitUntil: 'domcontentloaded' }); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1200); };

// A) Overview: counts per card + holdings collapsed + '장 수' header
await open('overview');
const holdingsBody = await p.locator('#sec-holdings').innerText();
console.log('HOLDINGS collapsed (no bars text):', !holdingsBody.includes('GPU 분포'));
const occ = await p.locator('#sec-occupancy').innerText();
const counts = [...occ.matchAll(/(우수 활용 과제|저활용 과제)\s+(\d+)/g)].map(m => `${m[1]}:${m[2]}`);
console.log('OVERVIEW counts:', counts.join(' | '));
console.log("OVERVIEW '장 수' header:", occ.includes('장 수') && !occ.includes('장 수(H100기준)'));

// expand 우수 row 1 → detail fully visible?
const rows = p.locator('#sec-occupancy tr.gd-row');
await rows.nth(0).click(); await p.waitForTimeout(600);
const detail = p.locator('#sec-occupancy').getByText('활용 지표').first();
const dbb = await detail.boundingBox();
console.log('EXPANDED detail visible in viewport:', !!dbb && dbb.y > 0);
const unitTbl = await p.locator('#sec-occupancy').innerText();
const seg = unitTbl.slice(unitTbl.indexOf('Unit 구성'), unitTbl.indexOf('Unit 구성') + 120).replace(/\s+/g,' ');
console.log('OV expand Unit header:', seg.slice(0, 90));
await p.locator('#sec-occupancy').screenshot({ path: 'design/shots/feedback/r3_rank_expand.png' });

// B) Resource: '수량' header, counts via grade filter (추론/학습), divisions
await open('resource');
const hdr = await p.locator('#res-table thead').innerText();
console.log("RES header has 수량:", hdr.includes('수량') && !hdr.includes('H100'), '| divisions col sample:');
const fb = p.locator('#res-toolbar button', { hasText: /등급/ }).first();
const countTxt = async () => (await p.locator('#res-toolbar span', { hasText: '/' }).first().innerText());
// 추론 우수
await fb.click(); await p.waitForTimeout(250); await p.locator('text=우수').last().click(); await p.waitForTimeout(450);
console.log('RES 추론 우수 total:', await countTxt());
// 추론 저활용
await p.locator('#res-toolbar button', { hasText: /우수|등급/ }).first().click(); await p.waitForTimeout(250);
await p.locator('text=저활용').last().click(); await p.waitForTimeout(450);
console.log('RES 추론 저활용 total:', await countTxt());
// 학습 tab
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click(); await p.waitForTimeout(500);
console.log('RES 학습 저활용 total:', await countTxt());
await p.locator('#res-toolbar button', { hasText: /저활용|등급/ }).first().click(); await p.waitForTimeout(250);
await p.locator('text=우수').last().click(); await p.waitForTimeout(450);
console.log('RES 학습 우수 total:', await countTxt());

// C) 학습 detail: no 모델 col + '수량(H100 기준)'
await p.locator('#res-toolbar button', { hasText: /우수|등급/ }).first().click(); await p.waitForTimeout(250);
await p.locator('text=전체').last().click(); await p.waitForTimeout(400);
await p.locator('#res-table tr.gd-row').first().click(); await p.waitForTimeout(600);
const det = (await p.locator('#res-table').innerText()).replace(/\s+/g,' ');
const ui = det.indexOf('Unit 구성');
console.log('TRAIN Unit header:', det.slice(ui, ui+100));
await p.locator('#res-table').screenshot({ path: 'design/shots/feedback/r3_train_unit.png' });

// D) 사업부 dropdown options
const opts = await p.locator('select').nth(1).locator('option').allInnerTexts();
console.log('사업부 options:', opts.join(', '));
await b.close().catch(()=>{});
