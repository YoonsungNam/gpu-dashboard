/**
 * Re-verify hover state of the Overview 사용추이 inference trend card:
 * hover over the chart so the tooltip + active dots render, then screenshot
 * the card element. Usage: node tools/shoot_hover_trend.mjs <port>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const port = process.argv[2] || '5173';
mkdirSync('design/shots/audit_v2_after', { recursive: true });
const b = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=overview`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(() => {});
await p.waitForTimeout(1800);

// Find the card containing the Inference trend chart.
const card = p.locator('div', { hasText: 'Inference / 추론' }).filter({ has: p.locator('.recharts-wrapper') }).last();
const chart = card.locator('.recharts-wrapper').first();
await chart.scrollIntoViewIfNeeded();
const box = await chart.boundingBox();
if (!box) {
  console.log('chart not found');
  process.exit(1);
}
// Hover near 70% across the plot, mid-height, to land on a data point.
await p.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 8 });
await p.waitForTimeout(700);
await card.screenshot({ path: 'design/shots/audit_v2_after/r_ov_trend_hover.png' });
console.log('shot r_ov_trend_hover');
await b.close().catch(() => {});
