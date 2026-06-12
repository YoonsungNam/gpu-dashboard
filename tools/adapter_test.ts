/**
 * 어댑터 단위 테스트 (HANDOFF §4 — backend 부재 시의 계약 검증).
 * fixture(가정한 backend 응답) → adapter → mock/types.ts 계약 검증.
 * 실행: npm run test:adapters  (vite-node)
 *
 * 타입 적합성은 아래의 명시적 타입 주석(KpiByTask[] 등)으로 tsc가 보장하고,
 * 런타임 값은 eq() 단언으로 확인한다.
 */
import {
  adaptFilters,
  adaptKpiByTask,
  adaptProjects,
  adaptProjectUnits,
  adaptRank,
  adaptUtilTrend,
  rollupGroupSeries,
  rollupTokenView,
} from '../src/api/adapters';
import {
  FIX_FILTERS,
  FIX_KPI_NO_TOTAL,
  FIX_KPI_WITH_TOTAL,
  FIX_PROJECTS,
  FIX_RANK,
  FIX_SERVICE_SUMMARY,
  FIX_SERVICE_TS,
  FIX_TREND_FLAT,
  FIX_TREND_RECORD,
  FIX_UNITS,
} from '../src/api/fixtures';
import type { Filters, KpiByTask, ProjectRow, ProjectUnitsResponse } from '../src/mock/types';

let failures = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) {
    console.log('ok ', name);
  } else {
    failures++;
    console.log('FAIL', name, `\n  got:  ${g}\n  want: ${w}`);
  }
}

/* ---- adaptProjects: 동적 키 평탄화 + member_tasks + quota 폴백 + grade 파생 ---- */
const projects: ProjectRow[] = adaptProjects(FIX_PROJECTS);
eq('projects: member_tasks', projects.map((p) => p.member_tasks), [['추론'], ['학습'], ['추론']]);
eq('projects: 동적키 평탄화 (추론_gpu_ut → inference_gpu_ut)',
  projects.map((p) => [p.inference_gpu_ut, p.training_gpu_ut ?? null]),
  [[19.7, null], [0, 84], [55, null]]);
eq('projects: WH/AH 평탄화', [projects[0].inference_gpu_ut_working, projects[0].inference_gpu_ut_nonworking], [27.7, 3.7]);
eq('projects: quota (직접 키 / 학습_gpu_total 폴백)', projects.map((p) => p.quota), [16, 32, 8]);
// P001 생산시스템 연계: slot 68.2 ≤ 75 → 저활용 · P002 학습 84/90 → 우수 · P003 gpu 55 ≥ 40 → 우수
eq('projects: grade = gradeOf 파생', projects.map((p) => p.grade), ['저활용', '우수', '우수']);

/* ---- adaptRank: 전체 배열 → gradeOf로 {good, alert} 분류 + 정렬 ---- */
const rank = adaptRank(FIX_RANK);
eq('rank: 추론 분류 수 (우수2/저활용1, 중간 제외)', [rank['추론'].good_count, rank['추론'].alert_count], [2, 1]);
eq('rank: 우수 gpu 내림차순', rank['추론'].good.map((r) => r.project_id), ['R1', 'R2']);
eq('rank: 저활용 식별 (생산시스템 연계 slot≤75)', rank['추론'].alert.map((r) => r.project_id), ['R3']);
eq('rank: purpose 보존 (배지 색 판정에 필요)', rank['추론'].good[0].purpose, '일반업무');
eq('rank: 학습 분류', [rank['학습'].good_count, rank['학습'].alert_count], [1, 1]);

/* ---- adaptProjectUnits: reclaim_estimate를 용도별 규칙에서 파생 ---- */
const units: ProjectUnitsResponse = adaptProjectUnits(FIX_UNITS, '추론');
const re = units.info.reclaim_estimate!;
eq('units: 게이지 = 생산시스템 연계 규칙 조건 (GPU 5% · Slot 75%)',
  re.map((x) => [x.label, x.basis.target_pct]),
  [['GPU Util 기준', 5], ['Slot Util 기준', 75]]);
// gpu 19.7 ≥ 5 → 회수 없음 · slot 68.2 < 75 → round(16×(1−68.2/75)) = 1
eq('units: 회수 수량 (충족=0 / 미달=추정)', re.map((x) => x.basis.reclaim_count), [0, 1]);
eq('units: 회수 모수 = Unit 수량 합', re.map((x) => x.basis.total_count), [16, 16]);

/* ---- adaptKpiByTask: gpu_total 폴백 (🔴 backend 추가 전) / 통과 (추가 후) ---- */
const kpiFallback: KpiByTask[] = adaptKpiByTask(FIX_KPI_NO_TOTAL, projects);
eq('kpi: gpu_total 폴백 = projects quota 합 (추론 16+8 / 학습 32)',
  kpiFallback.map((k) => k.gpu_total), [24, 32]);
const kpiDirect: KpiByTask[] = adaptKpiByTask(FIX_KPI_WITH_TOTAL);
eq('kpi: backend gpu_total 그대로 통과', kpiDirect.map((k) => k.gpu_total), [660, 2200]);

/* ---- adaptFilters: is_critical 주입 ---- */
const filters: Filters = adaptFilters(FIX_FILTERS);
eq('filters: is_critical 상수 주입', filters.is_critical, ['Y', 'N']);
eq('filters: divisions 보존', filters.divisions.length, 6);

/* ---- adaptUtilTrend: 레코드/평탄 배열 동등 정규화 ---- */
eq('trend: 레코드 형태 == 평탄 배열 형태', adaptUtilTrend(FIX_TREND_RECORD), adaptUtilTrend(FIX_TREND_FLAT));
eq('trend: task 분리', adaptUtilTrend(FIX_TREND_FLAT)['추론'].length, 2);

/* ---- rollupTokenView: (B) 프론트 집계 — 합계·점유율·정렬 ---- */
const view = rollupTokenView(FIX_SERVICE_SUMMARY, 28);
eq('token: 그룹/서비스 수', [view.totals.group_count, view.totals.service_count], [2, 3]);
eq('token: 일평균 합계 = Σ(그룹) = Σ(서비스 입력+출력)', view.totals.avg_total, 100_000_000);
eq('token: 그룹 점유율 (70M/30M → 70%/30%)', view.groups.map((g) => g.share_pct), [70, 30]);
eq('token: 그룹 내 서비스 점유율 합 ≈ 100',
  Math.round(view.groups[0].services.reduce((s, x) => s + x.share_pct, 0)), 100);
eq('token: 그룹 내 정렬 (avg_total 내림차순)', view.groups[0].services.map((s) => s.service_id), ['S1', 'S2']);
eq('token: 여분 필드(input_tokens) drop', 'input_tokens' in view.groups[0].services[0], false);
eq('token: day_count 보존', view.totals.day_count, 28);

/* ---- rollupGroupSeries: 그룹 상위 5개 서비스만, 점유율 순서 ---- */
const series = rollupGroupSeries(FIX_SERVICE_TS, view, 'G1');
eq('token series: G1 서비스만 (S3 제외)', [...new Set(series.map((p) => p.service_id))], ['S1', 'S2']);
eq('token series: 점유율 순 + ts 순', series.map((p) => `${p.service_id}@${p.ts.slice(8)}`), ['S1@04', 'S1@05', 'S2@04']);

if (failures) {
  console.log(`\n✗ ${failures}건 실패`);
  process.exit(1);
}
console.log('\n✓ adapter 테스트 전체 통과');
