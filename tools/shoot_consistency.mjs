import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots/feedback', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 1, acceptDownloads: true });
const p = await ctx.newPage();
const open = async (screen) => { await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' }); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1200); };

// 1) Overview per-task project counts
await open('overview');
const ovText = await p.locator('#sec-occupancy').innerText();
const ovCounts = [...ovText.matchAll(/([\d,]+) Projects/g)].map(m => m[1]);
console.log('OVERVIEW Projects:', ovCounts.join(' / '));

// 2) Resource tab counts + toolbar count
await open('resource');
const tabs = await p.locator('button[role="tab"]').allInnerTexts();
const count = await p.locator('#res-toolbar span', { hasText: '/' }).first().innerText();
console.log('RESOURCE tabs:', tabs.join(' | '), '· count:', count);

// 3) grade-rule integrity: open 저활용 filter, check every visible row has the chip; also scan page 1 rows for rule violations
const fb = p.locator('#res-toolbar button', { hasText: /등급|저활용|우수/ }).first();
await fb.click(); await p.waitForTimeout(300);
await p.locator('text=저활용').last().click(); await p.waitForTimeout(500);
const lowRows = await p.locator('#res-table tr.gd-row').count();
const lowChips = await p.locator('#res-table tr.gd-row >> text=저활용').count();
console.log(`저활용 filter: rows=${lowRows} chips=${lowChips} (must be equal)`);
await p.screenshot({ path: 'design/shots/feedback/grade_filtered.png', fullPage: false });

// 4) CSV download fires
const dl = p.waitForEvent('download', { timeout: 10000 });
await p.locator('#res-toolbar button', { hasText: '다운로드' }).click();
const d = await dl;
console.log('DOWNLOAD:', d.suggestedFilename());

// 5) metric defs modal sections
await p.getByRole('button', { name: /지표 정의/ }).click(); await p.waitForTimeout(400);
const modal = await p.locator('[role="dialog"]').innerText();
console.log('MODAL has 등급기준:', modal.includes('과제 등급 기준'), '· 용도별:', modal.includes('모델 개발'));
await p.locator('[role="dialog"]').screenshot({ path: 'design/shots/feedback/metric_defs_v2.png' });
await p.keyboard.press('Escape');

// 6) token download
await open('tokens');
const dl2 = p.waitForEvent('download', { timeout: 10000 });
await p.locator('#tok-toolbar button', { hasText: '다운로드' }).click();
console.log('TOKEN DOWNLOAD:', (await dl2).suggestedFilename());

await b.close().catch(()=>{});
