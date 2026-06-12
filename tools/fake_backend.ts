/**
 * 픽스처를 서빙하는 가짜 backend (dev 검증용) — 사내 backend 없이
 * VITE_USE_MOCK=false 경로(client → vite proxy → adapter → useData)를
 * 끝까지 돌려보기 위한 것. vite proxy는 경로를 rewrite하지 않으므로
 * /board/api 프리픽스 그대로 서빙한다.
 * 실행: npx vite-node tools/fake_backend.ts  (port 8000)
 */
import http from 'node:http';
import {
  FIX_FILTERS,
  FIX_KPI_NO_TOTAL,
  FIX_PROJECTS,
  FIX_RANK,
  FIX_SERVICE_SUMMARY,
  FIX_SERVICE_TS,
  FIX_TREND_RECORD,
  FIX_UNITS,
} from '../src/api/fixtures';

const routes: Record<string, unknown> = {
  '/board/api/health': { status: 'ok' },
  '/board/api/filters': FIX_FILTERS,
  '/board/api/gpu-count-by-task': { 추론: 24, 학습: 32 },
  '/board/api/kpi-by-task': FIX_KPI_NO_TOTAL, // gpu_total 없음 → adapter 폴백 경로 검증
  '/board/api/top-bottom-projects': FIX_RANK,
  '/board/api/timeseries-by-task': FIX_TREND_RECORD,
  '/board/api/quota-by-env-gpu': [
    { environment: 'AIP', gpu_model: 'H100', gpu_count: 512 },
    { environment: 'DS Cloud', gpu_model: 'A100', gpu_count: 256 },
  ],
  '/board/api/projects': FIX_PROJECTS,
  '/board/api/project/units': FIX_UNITS,
  '/board/api/service/summary': FIX_SERVICE_SUMMARY,
  '/board/api/service/timeseries': FIX_SERVICE_TS,
};

http
  .createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0];
    const body = routes[path];
    console.log(`${res ? 'GET' : ''} ${req.url} → ${body ? 200 : 404}`);
    if (!body) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{"detail":"not found"}');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  })
  .listen(8000, () => console.log('fake backend on :8000 (fixtures)'));
