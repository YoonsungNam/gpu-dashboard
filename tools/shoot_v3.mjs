import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots/v3', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const open = async (s) => { await p.goto(`http://localhost:${port}/?screen=${s}`, { waitUntil: 'domcontentloaded' }); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1300); };

// 1) resource summary strip + two-row toolbar
await open('resource');
await p.screenshot({ path: 'design/shots/v3/r_summary.png', clip: { x: 224, y: 56, width: 1696, height: 260 } });
const sum = (await p.locator('#res-toolbar').innerText()).replace(/\s+/g,' ');
console.log('SUMMARY:', sum.slice(0, 120));
// 학습 tab summary switches
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click(); await p.waitForTimeout(600);
console.log('SUMMARY(학습):', (await p.locator('#res-toolbar').innerText()).replace(/\s+/g,' ').slice(0, 110));
// footer legend per tab (학습 → 40/20, 75/65)
const foot = (await p.locator('#res-footer').innerText()).replace(/\s+/g,' ');
console.log('FOOTER(학습):', foot.slice(0, 110));

// 2) metric defs popover
await p.getByRole('button', { name: /지표 정의/ }).click(); await p.waitForTimeout(500);
await p.screenshot({ path: 'design/shots/v3/r_defs_popover.png', clip: { x: 1280, y: 40, width: 640, height: 900 } });
const dlg = (await p.locator('[role="dialog"]').innerText()).replace(/\s+/g,' ');
console.log('DEFS:', dlg.includes('모니터링 지표 정의'), '| 임계 학습 40:', dlg.includes('≥ 40%'), '| 65-75:', dlg.includes('65-75%'));
await p.keyboard.press('Escape');

// 3) user menu guide
await p.locator('aside').getByText('김삼성').click(); await p.waitForTimeout(400);
await p.screenshot({ path: 'design/shots/v3/r_usermenu.png', clip: { x: 0, y: 900, width: 460, height: 500 } });
const menu = (await p.locator('[role="menu"]').innerText()).replace(/\s+/g,' ');
console.log('MENU:', menu);
await p.keyboard.press('Escape');

// 4) token KPI icons
await open('tokens');
await p.screenshot({ path: 'design/shots/v3/r_token_kpis.png', clip: { x: 224, y: 56, width: 1100, height: 120 } });
console.log('done');
await b.close().catch(()=>{});
