// 2026-06-11 피드백 라운드 4 검증 캡처:
// ① 임계기준/등급기준 통합(정책 파생 색·지표 정의 패널) ② GPU 수 정합성+스케일
// ③ 토큰 13그룹/46서비스/B단위 ④ 추이 현실화(주중·주말, 일별 도트/축, Slot≫GPU)
import { chromium } from 'playwright';
const port = process.argv[2] || '5173';
const OUT = 'design/shots/feedback4';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const open = async (s) => {
  await p.goto(`http://localhost:${port}/?screen=${s}`, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(1300);
};

// ---- Overview: GPUs 수치 + 추이 (도트/일별 축/주말 딥) ----
await open('overview');
await p.screenshot({ path: `${OUT}/o_full.png`, fullPage: true });
const gpus = await p.locator('#sec-util').innerText();
console.log('[Overview 활용현황 카드]', gpus.replace(/\n+/g, ' | ').slice(0, 400));
await p.locator('#sec-trend').screenshot({ path: `${OUT}/o_trend.png` });
// 점검 배지 색 (용도별 임계)
await p.locator('#sec-occupancy').screenshot({ path: `${OUT}/o_occupancy.png` });

// ---- 자원 추론: Summary(H100 없음)·범례·배지 ----
await open('resource');
const sum = await p.locator('#res-toolbar').innerText();
console.log('[자원 추론 Summary]', sum.replace(/\n+/g, ' | '));
await p.screenshot({ path: `${OUT}/r_infer.png`, fullPage: true });
// 펼침 상세 (정책 파생 색 4단계)
await p.locator('#res-table tbody tr').first().click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/r_infer_expand.png`, fullPage: true });
await p.locator('#res-table tbody tr').first().click();

// ---- 자원 학습: Summary(H100 유지) ----
await p.locator('button[role="tab"]', { hasText: '학습' }).first().click();
await p.waitForTimeout(600);
const sumT = await p.locator('#res-toolbar').innerText();
console.log('[자원 학습 Summary]', sumT.replace(/\n+/g, ' | '));
await p.screenshot({ path: `${OUT}/r_train.png`, fullPage: true });

// ---- 지표 정의 패널 (새 임계 기준 그리드) ----
await p.getByText('지표 정의').first().click();
await p.waitForTimeout(500);
await p.locator('[role="dialog"]').screenshot({ path: `${OUT}/defs_panel.png` });
console.log('[지표 정의]', (await p.locator('[role="dialog"]').innerText()).replace(/\n+/g, ' | ').slice(0, 700));
await p.keyboard.press('Escape');

// ---- 토큰: 13그룹/46서비스/B ----
await open('tokens');
await p.screenshot({ path: `${OUT}/t_page.png`, fullPage: true });
const kpis = await p.locator('main').innerText();
const m = kpis.match(/서비스 그룹[\s\S]{0,40}|일평균 토큰 합계[\s\S]{0,30}/g);
console.log('[토큰 KPI]', (m || []).join(' / ').replace(/\n+/g, ' '));

await b.close().catch(() => {});
console.log('saved →', OUT);
