// Capture redesigned Summary cards against the production preview server (stable
// under host CPU load — no on-demand dev transforms). Usage: node tools/shoot_summary_preview.mjs <port>
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const port = process.argv[2] || '4180';
const OUT = 'design/shots/summary_redesign';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.setDefaultTimeout(60000);
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
p.on('pageerror', (e) => errs.push('PAGE: ' + String(e).slice(0, 140)));
const open = async (s) => {
  await p.goto(`http://localhost:${port}/?screen=${s}`, { waitUntil: 'load', timeout: 60000 });
  await p.locator('#res-summary, #tok-summary').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
};

await open('resource');
await p.locator('#res-summary').screenshot({ path: `${OUT}/res_inf_summary.png` });
console.log('[자원 추론 Summary]', (await p.locator('#res-summary').innerText()).replace(/\n+/g, ' | '));
console.log('[자원 toolbar]', (await p.locator('#res-toolbar').innerText()).replace(/\n+/g, ' | ').slice(0, 110));
await p.screenshot({ path: `${OUT}/res_inf_full.png`, clip: { x: 0, y: 0, width: 1920, height: 400 } });

await p.locator('button[role="tab"]', { hasText: '학습' }).first().click();
await p.waitForTimeout(700);
await p.locator('#res-summary').screenshot({ path: `${OUT}/res_train_summary.png` });
console.log('[자원 학습 Summary]', (await p.locator('#res-summary').innerText()).replace(/\n+/g, ' | '));

await open('tokens');
await p.locator('#tok-summary').screenshot({ path: `${OUT}/tok_summary.png` });
console.log('[토큰 Summary]', (await p.locator('#tok-summary').innerText()).replace(/\n+/g, ' | '));
console.log('[토큰 toolbar]', (await p.locator('#tok-toolbar').innerText()).replace(/\n+/g, ' | '));
await p.screenshot({ path: `${OUT}/tok_full.png`, clip: { x: 0, y: 0, width: 1920, height: 360 } });

await open('resource');
await p.locator('#res-table tbody tr.gd-row').first().screenshot({ path: `${OUT}/row_badges.png` });
console.log('console/page errors:', errs.length, errs.slice(0, 3).join(' | '));
await b.close();
console.log('saved ->', OUT);
