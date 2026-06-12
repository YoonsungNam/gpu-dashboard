/**
 * realSource 통합 테스트 — 가짜 backend(:8000, fixtures)에 대고
 * client(fetch/쿼리 빌더) → adapter 전 경로를 노드에서 실행.
 * 실행: VITE_API_BASE=http://localhost:8000/board/api npx vite-node tools/realsource_test.ts
 */
import { realSource } from '../src/data/realSource';
import { DEFAULT_FILTERS } from '../src/mock/data';

const f = DEFAULT_FILTERS;
let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(ok ? 'ok ' : 'FAIL', name, ok ? '' : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
};

const filters = await realSource.getFilters();
eq('getFilters: divisions 6 + is_critical 주입', [filters.divisions.length, filters.is_critical], [6, ['Y', 'N']]);

const kpi = await realSource.getKpiByTask(f);
eq('getKpiByTask: gpu_total 폴백 (추론 24 / 학습 32)', kpi.map((k) => [k.task, k.gpu_total]), [['추론', 24], ['학습', 32]]);

const rank = await realSource.getRankByTask(f);
eq('getRankByTask: 분류 (추론 2/1 · 학습 1/1)',
  [rank['추론'].good_count, rank['추론'].alert_count, rank['학습'].good_count, rank['학습'].alert_count],
  [2, 1, 1, 1]);

const trend = await realSource.getUtilTrend(f);
eq('getUtilTrend: 정규화', [trend['추론'].length, trend['학습'].length], [2, 1]);

const projects = await realSource.getProjects(f);
eq('getProjects: 평탄화 + grade', projects.map((p) => [p.project_id, p.grade]), [['P001', '저활용'], ['P002', '우수'], ['P003', '우수']]);

const units = await realSource.getProjectUnits('P001', '추론', f);
eq('getProjectUnits: 회수 목표 = 생산시스템 연계 규칙 (5/75)',
  units.info.reclaim_estimate!.map((x) => x.basis.target_pct), [5, 75]);

const quota = await realSource.getQuotaByEnvGpu();
eq('getQuotaByEnvGpu: passthrough', quota.length, 2);

const view = await realSource.getTokenView(f);
eq('getTokenView: 롤업 (그룹2 · 서비스3 · 100M)',
  [view.totals.group_count, view.totals.service_count, view.totals.avg_total], [2, 3, 100_000_000]);

const series = await realSource.getGroupSeries('G1', f);
eq('getGroupSeries: G1 상위 서비스만', [...new Set(series.map((p) => p.service_id))], ['S1', 'S2']);

if (fail) { console.log(`✗ ${fail}건 실패`); process.exit(1); }
console.log('✓ realSource 통합 테스트 전체 통과 (fixture backend)');
