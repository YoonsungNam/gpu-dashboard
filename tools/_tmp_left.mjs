import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const src = process.argv[2];
const box = JSON.parse(process.argv[3]);
const b = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
const p = await (await b.newContext()).newPage();
await p.route('**/img.png', r => r.fulfill({ body: readFileSync(src), contentType: 'image/png' }));
await p.route('**/page.html', r => r.fulfill({ contentType: 'text/html', body: `<canvas id="c"></canvas><script>
const img=new Image();img.onload=()=>{const c=document.getElementById('c');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);window.ctx=x;document.title='done';};img.src='/img.png';
</script>` }));
await p.goto('http://x.local/page.html');
await p.waitForFunction(() => document.title === 'done');
const res = await p.evaluate(([x,y,w,h]) => {
  const d = window.ctx.getImageData(x,y,w,h).data;
  // column darkness profile: report columns whose min-luma < 120
  const cols = [];
  for (let i=0;i<w;i++) {
    let m=255;
    for (let j=0;j<h;j++){const o=(j*w+i)*4;const l=0.299*d[o]+0.587*d[o+1]+0.114*d[o+2];if(l<m)m=l;}
    if (m<120) cols.push(x+i);
  }
  const r=[];
  for (const c of cols){if(r.length&&c-r[r.length-1][1]<=6)r[r.length-1][1]=c;else r.push([c,c]);}
  return r.map(([a,b])=>a+'-'+b).join(', ');
}, box);
console.log(res);
await b.close();
