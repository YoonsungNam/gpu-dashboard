import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const port = process.argv[2] || '5173';
mkdirSync('design/shots', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--force-color-profile=srgb'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 });
const shoot = async (screen, out, clickSel) => {
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/?screen=${screen}`, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(1600);
  if (clickSel) { const el = await p.$(clickSel); if (el) { await el.click(); await p.waitForTimeout(900); } else console.log('MISS click', clickSel); }
  await p.screenshot({ path: `design/shots/${out}.png`, fullPage: true });
  console.log('shot', out);
  await p.close();
};
await shoot('overview', 'v2_overview');
await shoot('resource', 'v2_resource');
await shoot('resource', 'v2_resource_expanded', '#res-table tr.gd-row');
await shoot('tokens', 'v2_tokens');
await shoot('tokens', 'v2_tokens_expanded', 'table tbody tr');
await b.close().catch(()=>{});
