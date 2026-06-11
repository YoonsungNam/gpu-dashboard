import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=resource`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1200);
const tb = p.locator('#res-toolbar');
const countTxt = async () => (await tb.locator('span', { hasText: '/' }).first().innerText());
const pickGrade = async (label) => {
  await tb.locator('button', { hasText: /등급|우수|저활용|전체/ }).first().click();
  await p.waitForTimeout(250);
  await tb.getByText(label, { exact: true }).last().click();
  await p.waitForTimeout(450);
};
await pickGrade('우수');   console.log('RES 추론 우수:', await countTxt());
await pickGrade('저활용'); console.log('RES 추론 저활용:', await countTxt());
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click(); await p.waitForTimeout(500);
console.log('RES 학습 저활용:', await countTxt());
await pickGrade('우수');   console.log('RES 학습 우수:', await countTxt());
await pickGrade('전체');

// 학습 detail: 모델 없음 + '수량(H100 기준)'
await p.locator('#res-table tr.gd-row').first().click(); await p.waitForTimeout(600);
const det = (await p.locator('#res-table').innerText()).replace(/\s+/g,' ');
const ui = det.indexOf('Unit 구성');
console.log('TRAIN Unit header:', det.slice(ui, ui+90));
await p.locator('#res-table').screenshot({ path: 'design/shots/feedback/r3_train_unit.png' });

const opts = await p.locator('select').nth(1).locator('option').allInnerTexts();
console.log('사업부 options:', opts.join(', '));
await b.close().catch(()=>{});
