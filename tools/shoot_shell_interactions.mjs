/**
 * Verify the SHELL interaction feedback: sidebar collapse rail, 정책 안내
 * modal, profile popover menu, 지표 정의 modal, and the updated 기간/과제 구분
 * filters. Usage: node tools/shoot_shell_interactions.mjs <port>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const port = process.argv[2] || '5173';
const OUT = 'design/shots/shell_interactions';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=resource`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(() => {});
await p.waitForTimeout(1500);

// 0. Baseline expanded shell
await p.screenshot({ path: `${OUT}/0_expanded.png` });

// 1. Collapse the sidebar
await p.click('button[aria-label="사이드바 접기"]');
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/1_collapsed.png` });
await p.click('button[aria-label="사이드바 펼치기"]');
await p.waitForTimeout(400);

// 2. 정책 안내 modal
await p.click('button:has-text("정책 안내")');
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/2_policy_modal.png` });
await p.keyboard.press('Escape');
await p.waitForTimeout(300);

// 3. Profile popover
await p.click('button:has-text("김삼성")');
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/3_user_menu.png` });
await p.mouse.click(960, 300); // backdrop click closes
await p.waitForTimeout(300);

// 4. 지표 정의 modal
await p.click('button:has-text("지표 정의")');
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/4_metric_defs.png` });
await p.keyboard.press('Escape');
await p.waitForTimeout(300);

// 5. 기간 dropdown options + 과제 구분 label (DOM assertions)
const periodOpts = await p.$$eval('select', (sels) =>
  sels.map((s) => Array.from(s.options).map((o) => o.value)),
);
console.log('selects:', JSON.stringify(periodOpts));
const labels = await p.$$eval('label', (ls) => ls.map((l) => l.textContent?.trim().split('전체')[0]));
console.log('labels:', JSON.stringify(labels));

console.log('done');
await b.close().catch(() => {});
