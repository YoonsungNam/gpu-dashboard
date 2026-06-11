import { projects, getProjectUnits, getUtilTrend, DEFAULT_FILTERS, projectUtil, filterProjects, PERIOD_DAYS, DIVISIONS as _d } from '../src/mock/data';
import { getTokenView } from '../src/mock/tokens';
import type { GlobalFilters } from '../src/mock/data';
// 1) Unit 합계 == quota (전수)
let bad = 0;
for (const p of projects) {
  const u = getProjectUnits(p.project_id, p.member_tasks[0], DEFAULT_FILTERS);
  const sum = u.units.reduce((s, x) => s + x.gpu_num, 0);
  if (sum !== p.quota) { bad++; if (bad < 4) console.log('MISMATCH', p.project_id, sum, '!=', p.quota); }
}
console.log('Unit합==quota:', bad === 0 ? 'OK (130/130)' : `FAIL ${bad}건`);
// 2) 학습 GPU>Slot 역전 — 전 필터 조합의 window mean에서 0건이어야 함
const periods = Object.keys(PERIOD_DAYS) as GlobalFilters['period'][];
const divisions = ['전체', 'AI센터', 'DX', 'S.LSI', 'SAIT', '글로벌 제조&인프라총괄', '메모리'];
let inv = 0;
for (const period of periods) for (const division of divisions) for (const taskClass of ['전체', '전략', '일반'] as const) {
  const f: GlobalFilters = { period, division, taskClass };
  const pool = filterProjects(f).filter((p) => p.member_tasks.includes('학습'));
  if (!pool.length) continue;
  const gpu = pool.reduce((s, p) => s + projectUtil(p, '학습', f).gpu, 0) / pool.length;
  const slot = pool.reduce((s, p) => s + projectUtil(p, '학습', f).slot, 0) / pool.length;
  if (gpu >= slot) { inv++; console.log('INVERT', period, division, taskClass, gpu.toFixed(1), slot.toFixed(1)); }
}
console.log('학습 Slot>GPU 전 조합:', inv === 0 ? `OK (${periods.length * divisions.length * 3}개 조합)` : `FAIL ${inv}건`);
// 3) 그룹 내 서비스명 중복 0건
const tv = getTokenView(DEFAULT_FILTERS);
let dup = 0;
for (const g of tv.groups) {
  const names = g.services.map((s) => s.service_name);
  if (new Set(names).size !== names.length) { dup++; console.log('DUP in', g.service_group_name, names); }
}
console.log('그룹 내 서비스명 중복:', dup === 0 ? 'OK' : `FAIL ${dup}건`);
