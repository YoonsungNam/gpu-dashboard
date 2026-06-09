import { chromium } from 'playwright';
const port = process.argv[2] || '5180';
const screen = process.argv[3] || 'resource';
const b = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 } });
const p = await ctx.newPage();
p.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 240)));
p.on('pageerror', (e) => console.log('PAGEERROR', e.message.split('\n').slice(0, 3).join(' | ')));
p.on('crash', () => console.log('PAGE CRASHED'));
try {
  await p.goto(`http://localhost:${port}/?screen=${screen}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await p.waitForTimeout(2000);
  const info = await p.evaluate(() => ({
    h: document.body.scrollHeight,
    w: document.body.scrollWidth,
    nodes: document.querySelectorAll('*').length,
  }));
  console.log('INFO', JSON.stringify(info));
  await p.screenshot({ path: `design/shots/${screen}_vp.png`, fullPage: false });
  console.log('viewport shot ok');
} catch (e) {
  console.log('ERR', e.message.split('\n')[0]);
}
await b.close().catch(() => {});
