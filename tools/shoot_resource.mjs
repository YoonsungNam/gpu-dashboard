import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--force-color-profile=srgb'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/?screen=resource`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1800);
const shoot = async (sel, out) => {
  const el = await p.$(sel);
  if (!el) { console.log('MISS', sel); return; }
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: `design/shots/${out}.png` });
  console.log('shot', out);
};
await shoot('#res-toolbar', 'r_res_toolbar');
await shoot('#res-table', 'r_res_table');
await shoot('#res-footer', 'r_res_footer');
// expand the first row, then re-shoot the table
const row = await p.$('#res-table tr.gd-row');
if (row) { await row.click(); await p.waitForTimeout(700); await shoot('#res-table', 'r_res_table_expanded'); }
else console.log('no expandable row found');
await b.close().catch(()=>{});
