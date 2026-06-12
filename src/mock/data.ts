/**
 * Mock data shaped exactly like the real API (see types.ts).
 * Deterministic (seeded) so screens look stable across reloads.
 * Replace these with real fetches when porting — the shapes already match.
 */
import type {
  Filters,
  GpuCountByTask,
  KpiByTask,
  ProjectGrade,
  ProjectRow,
  ProjectUnitsResponse,
  QuotaByEnvGpu,
  RankedProject,
  ServiceSummary,
  ServiceTimeseriesPoint,
  TaskType,
  UtilTrendPoint,
  YN,
} from './types';
import { gradeOf, reclaimEstimate } from '../lib/gradePolicy';

/* ---- tiny deterministic RNG (mulberry32) ---- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;

const DIVISIONS = ['AI센터', 'DX', 'S.LSI', 'SAIT', '글로벌 제조&인프라총괄', '메모리'];
const IMPORTANCE = ['전략', '핵심', '일반'];
// 용도 — 학습계(모델 학습/모델 개발) + 추론계(일반업무/생산시스템 연계/서비스테스트).
// 등급 정책(lib/gradePolicy.ts)의 reclaim 키와 연동: 생산시스템 연계는 전용 규칙,
// 나머지 추론 용도는 '기타' 폴백 규칙을 따른다.
const TRAIN_PURPOSES = ['모델 학습', '모델 개발'];
const INFER_PURPOSES = ['일반업무', '생산시스템 연계', '서비스테스트'];
const GPU_MODELS = [
  'H100', 'A100', 'V100', 'H200', 'P100', 'P40', 'B300', 'RTX Pro 6000', 'MI355X',
];
const PROJECT_NAMES = [
  'AI Vision Platform', 'Data Pipeline', '추천 엔진 RT', '이미지 생성 서빙',
  'Solution 개발용 학습', '파운드리 API 서빙', '메모리 검증 AI', 'Foundry 시뮬레이션',
  '글로벌 파운드리 연계', '백오피스 추론', '생성형 챗봇', '코드 어시스트',
  'GenAI Chat', '문서 요약 RT', '검색 랭킹 학습', '음성 인식 서빙',
  '광고 추천 학습', '이상탐지 추론', '수율 예측 학습', '공정 최적화',
  '품질 검사 비전', '재고 예측', '번역 엔진', '리뷰 분석',
];

/* ------------------------------------------------------------------ */
/* Global filters — the Header's 기간/사업부/과제 구분 drive EVERY page.   */
/* ------------------------------------------------------------------ */
export type PeriodKey = '최근 1일' | '최근 3일' | '최근 7일' | '최근 14일' | '최근 28일';
export const PERIOD_DAYS: Record<PeriodKey, number> = {
  '최근 1일': 1,
  '최근 3일': 3,
  '최근 7일': 7,
  '최근 14일': 14,
  '최근 28일': 28,
};
export type TaskClass = '전체' | '전략' | '일반';
export interface GlobalFilters {
  period: PeriodKey;
  division: string; // '전체' | one of filters.divisions
  taskClass: TaskClass;
}
export const DEFAULT_FILTERS: GlobalFilters = {
  period: '최근 28일',
  division: '전체',
  taskClass: '전체',
};

/** The 28-day fact window every aggregate derives from. 2026-05-04 = 월요일 —
 *  요일 인덱스 d%7 (5·6 = 토·일)이 주중/주말 사용 패턴을 만든다. */
export const DAYS = 28;
export const DATES = Array.from({ length: DAYS }, (_, d) => `2026-05-${String(4 + d).padStart(2, '0')}`);
const DOW = (d: number) => d % 7;
const IS_WEEKEND = (d: number) => DOW(d) >= 5;

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const tail = <T,>(xs: T[], n: number) => xs.slice(Math.max(0, xs.length - n));

/* ---- GET /api/projects ----
   Sized per 2026-06-11 운영 피드백: 추론 50개 내외 · 학습 80개 내외.
   탭별 용도가 겹치지 않도록 듀얼(추론+학습) 과제 없이 51 추론 + 79 학습 (총 130):
   추론 탭 용도 = 일반업무/생산시스템 연계/서비스테스트만, 학습 탭 = 모델 학습/모델 개발만.
   The first 24 keep the familiar base names; later rows get a numeric suffix.
   Grade comes from the shared purpose-aware rule in lib/gradePolicy.ts. */
const INFERENCE_ONLY = 51;
const TRAINING_ONLY = 79;

export const projects: ProjectRow[] = Array.from(
  { length: INFERENCE_ONLY + TRAINING_ONLY },
  (_, i) => {
    const r = rng(1000 + i);
    // Slot(할당 점유)은 통상 GPU Util(실사용)보다 훨씬 높다: slot 62-98% vs 추론 GPU 6-64%.
    const slot = round1(62 + r() * 36);
    const gpu = round1(6 + r() * 58);
    const tasks: TaskType[] = i < INFERENCE_ONLY ? ['추론'] : ['학습'];
    const base = PROJECT_NAMES[i % PROJECT_NAMES.length];
    const name =
      i < PROJECT_NAMES.length
        ? base
        : `${base} ${String(Math.floor(i / PROJECT_NAMES.length)).padStart(2, '0')}`;
    // Task-affine 용도 (2026-06-11 피드백): 추론 → 일반업무/생산시스템 연계/서비스테스트,
    // 학습 → 모델 학습/모델 개발. 탭과 용도 분류가 1:1로 대응한다.
    const purpose = i < INFERENCE_ONLY ? pick(r, INFER_PURPOSES) : pick(r, TRAIN_PURPOSES);
    return {
      project_id: `PRJ${String(i + 1).padStart(4, '0')}`,
      project_name: name,
      division: pick(r, DIVISIONS),
      purpose,
      business_importance: pick(r, IMPORTANCE),
      is_critical: (r() > 0.7 ? 'Y' : 'N') as YN,
      user_id: pick(r, ['hong.gil.dong', 'kim.cs', 'lee.yh', 'park.jm', 'choi.sw']),
      // 총 GPU 수량도 과제 수 스케일에 맞춤: 추론 전용 4-24장, 학습 관여 8-48장
      // (전 과제 합계가 보유 2,941장 안에 들어온다).
      quota: pick(r, tasks.includes('학습') ? [8, 16, 32, 48] : [4, 8, 16, 24]),
      inference_gpu_ut: gpu,
      inference_gpu_ut_working: round1(Math.min(100, gpu + 8)),
      inference_gpu_ut_nonworking: round1(Math.max(0, gpu - 16)),
      // 학습 GPU Util은 추론보다 높은 분포(18-88%)이되 Slot보다는 항상 낮게 —
      // 'Slot Util ≫ GPU Util' 통상 관계가 어떤 필터 조합에서도 역전되지 않는다.
      training_gpu_ut: round1(Math.min(18 + r() * 70, slot - 4)),
      slot_ut: slot,
      member_tasks: tasks,
      grade: gradeOf(tasks[0], purpose, {
        gpu,
        wh: Math.min(100, gpu + 8),
        slot,
      }) as ProjectGrade | null,
    };
  },
);

/**
 * Per-project DAILY utilization series — the single fact table. The static
 * ProjectRow fields above are kept as 28-day anchors; every page-visible
 * number is a window mean over these series, so 기간 changes stay coherent
 * everywhere (rows, grades, ranks, KPIs, trend lines, expand details).
 */
const clampPct = (v: number) => round1(Math.max(0, Math.min(100, v)));
export const projectDaily: Record<string, { gpu: number[]; train: number[]; slot: number[] }> =
  Object.fromEntries(
    projects.map((p, i) => {
      const r = rng(50_000 + i * 11);
      // 주말 추론 사용률은 주중의 42-58% 수준으로 가라앉고, 주중은 수요일쯤
      // 살짝 정점(±5%)을 찍는다. 학습은 연속 수행이라 주말 영향이 작고(-7%),
      // Slot(할당)은 주말에도 거의 그대로 점유된 채 유지된다.
      const weekendDip = 0.42 + r() * 0.16;
      const weekday = (d: number, dip: number) =>
        IS_WEEKEND(d) ? dip : 1 + 0.05 * Math.sin(((DOW(d) + 1) / 5) * Math.PI);
      const wave = (base: number, d: number, amp: number, phase: number) =>
        base + (r() - 0.5) * amp + Math.sin((d + phase) / 3.1) * (amp / 3);
      return [
        p.project_id,
        {
          gpu: Array.from({ length: DAYS }, (_, d) =>
            clampPct(wave(p.inference_gpu_ut, d, 14, i % 7) * weekday(d, weekendDip)),
          ),
          train: Array.from({ length: DAYS }, (_, d) =>
            clampPct(wave(p.training_gpu_ut ?? p.inference_gpu_ut, d, 16, (i + 3) % 7) * (IS_WEEKEND(d) ? 0.93 : 1)),
          ),
          slot: Array.from({ length: DAYS }, (_, d) =>
            clampPct(wave(p.slot_ut, d, 9, (i + 5) % 7) * (IS_WEEKEND(d) ? 0.985 : 1)),
          ),
        },
      ];
    }),
  );

/** Projects passing the 사업부 / 과제 구분 filters. */
export function filterProjects(f: GlobalFilters): ProjectRow[] {
  return projects.filter(
    (p) =>
      (f.division === '전체' || p.division === f.division) &&
      (f.taskClass === '전체' || (p.is_critical === 'Y' ? '전략' : '일반') === f.taskClass),
  );
}

/** Window-mean utilization for one project/task under the active 기간. */
export function projectUtil(
  p: ProjectRow,
  task: TaskType,
  f: GlobalFilters,
): { gpu: number; wh: number; ah: number; slot: number } {
  const n = PERIOD_DAYS[f.period];
  const d = projectDaily[p.project_id];
  const gpu = round1(mean(tail(task === '학습' ? d.train : d.gpu, n)));
  return {
    gpu,
    wh: clampPct(gpu + 8),
    ah: clampPct(gpu - 16),
    slot: round1(mean(tail(d.slot, n))),
  };
}

/* ---- GET /api/kpi-by-task?filters=… — DERIVED from the daily fact table ---- */
export function getKpiByTask(f: GlobalFilters): KpiByTask[] {
  const pool = filterProjects(f);
  return (['추론', '학습'] as TaskType[]).map((task) => {
    const ps = pool.filter((p) => p.member_tasks.includes(task));
    const u = ps.map((p) => projectUtil(p, task, f));
    return {
      task,
      // 과제 quota 합 — Overview 'GPUs'와 자원 Summary '총 GPU 수량'의 단일 소스.
      gpu_total: ps.reduce((t, p) => t + p.quota, 0),
      avg_gpu_ut: round1(mean(u.map((x) => x.gpu))),
      avg_gpu_ut_working: round1(mean(u.map((x) => x.wh))),
      avg_gpu_ut_nonworking: round1(mean(u.map((x) => x.ah))),
      avg_slot_ut: round1(mean(u.map((x) => x.slot))),
      project_count: ps.length,
    };
  });
}

/** Legacy default-filter view (dev gallery etc.). */
export const kpiByTask: KpiByTask[] = getKpiByTask(DEFAULT_FILTERS);

/* ---- GET /api/gpu-count-by-task — DERIVED: 과제 quota 합 (Overview/자원 동일) ---- */
export const gpuCountByTask: GpuCountByTask = Object.fromEntries(
  kpiByTask.map((k) => [k.task, k.gpu_total]),
);

/* ---- GET /api/project/units?project_id=…&task=… ----
   task scopes info.gpu_ut (and the reclaim gauges) so the expanded values
   match the row that was clicked: 학습 → training_gpu_ut, 추론 (default) →
   inference_gpu_ut. */
export function getProjectUnits(
  projectId: string,
  task: TaskType = '추론',
  f: GlobalFilters = DEFAULT_FILTERS,
): ProjectUnitsResponse {
  const p = projects.find((x) => x.project_id === projectId) ?? projects[0];
  // Window means — identical to the clicked row's displayed values.
  const u = projectUtil(p, task, f);
  const r = rng(parseInt(projectId.replace(/\D/g, '') || '1', 10) * 7 + 3);
  const unitCount = Math.min(2 + Math.floor(r() * 3), p.quota);
  // Unit별 수량은 과제 quota의 분할 — 합계가 정확히 quota와 일치해, 펼침 상세의
  // 수량 카드/회수 예상 모수/행의 수량 컬럼이 한 패널 안에서 모순되지 않는다.
  const base = Math.floor(p.quota / unitCount);
  const parts = Array.from({ length: unitCount }, (_, i) => base + (i < p.quota % unitCount ? 1 : 0));
  const units = Array.from({ length: unitCount }, (_, i) => {
    // Unit values orbit the project's window mean (deterministic offsets),
    // so they move coherently when the 기간 filter changes.
    const gpu = round1(Math.max(0, Math.min(100, u.gpu + (r() - 0.5) * 36)));
    const div = pick(r, ['mx', 'vd', 'dx', 'sr']);
    return {
      unit_id: `U${String(i + 1).padStart(3, '0')}`,
      unit_name: `ais-${div}사업부-serve-${String(i + 1).padStart(2, '0')}`,
      task: (r() > 0.5 ? '추론' : '학습') as TaskType,
      gpu_model: pick(r, GPU_MODELS),
      gpu_num: parts[i],
      unit_quota: parts[i],
      slot_ut: round1(Math.max(0, Math.min(100, u.slot + (r() - 0.5) * 30))),
      gpu_ut: gpu,
      gpu_ut_working: round1(Math.min(100, gpu + 7)),
      gpu_ut_nonworking: round1(Math.max(0, gpu - 18)),
    };
  });
  return {
    info: {
      project_name: p.project_name,
      division: p.division,
      purpose: p.purpose,
      business_importance: p.business_importance,
      slot_ut: u.slot,
      gpu_ut: u.gpu,
      gpu_ut_working: u.wh,
      gpu_ut_nonworking: u.ah,
      // 회수 게이지 = 이 과제 (태스크 × 용도)의 저활용 규칙 조건들. 목표값은
      // 각 조건의 경계값이라 지표 정의 패널의 임계 기준(빨강 구간)과 항상 일치
      // (생산시스템 연계 GPU 5% · 일반업무 등 GPU Util WH 30% · Slot 공통 75% 등).
      // 구현은 lib/gradePolicy.reclaimEstimate — 실 API adapter와 공유.
      reclaim_estimate: reclaimEstimate(task, p.purpose, u, p.quota),
    },
    units,
  };
}

/* ---- GET /api/top-bottom-projects?task=…&filters=… ----
   Same pool, same window means, same grade rule as the 활용 현황 rows —
   counts and lists agree with the grade filter under ANY header filters. */
export interface TaskRank {
  good_count: number;
  alert_count: number;
  good: RankedProject[];
  alert: RankedProject[];
}

export function getRankByTask(f: GlobalFilters): Record<TaskType, TaskRank> {
  const pool = filterProjects(f);
  const rankFor = (t: TaskType): TaskRank => {
    const graded = pool
      .filter((p) => p.member_tasks.includes(t))
      .map((p) => {
        const u = projectUtil(p, t, f);
        return { p, u, g: gradeOf(t, p.purpose, u) };
      });
    const toRanked = ({ p, u }: { p: ProjectRow; u: { gpu: number; slot: number } }): RankedProject => ({
      project_id: p.project_id,
      project_name: p.project_name,
      division: p.division,
      purpose: p.purpose,
      is_critical: p.is_critical,
      quota: p.quota,
      slot_ut: u.slot,
      gpu_ut: u.gpu,
      reason: `GPU Util ${u.gpu.toFixed(1)}%`,
    });
    const good = graded.filter((x) => x.g === '우수').sort((a, b) => b.u.gpu - a.u.gpu);
    const alert = graded.filter((x) => x.g === '저활용').sort((a, b) => a.u.gpu - b.u.gpu);
    return {
      good_count: good.length,
      alert_count: alert.length,
      good: good.map(toRanked),
      alert: alert.map(toRanked),
    };
  };
  return { 추론: rankFor('추론'), 학습: rankFor('학습') };
}

/** Legacy default-filter view. */
export const rankByTask: Record<TaskType, TaskRank> = getRankByTask(DEFAULT_FILTERS);

/* ---- GET /api/quota-by-env-gpu (all 9 GPU models across 4 envs; sums to exactly 2,941) ---- */
export const quotaByEnvGpu: QuotaByEnvGpu[] = [
  { environment: 'AIP', gpu_model: 'H100', gpu_count: 512 },
  { environment: 'AIP', gpu_model: 'H200', gpu_count: 384 },
  { environment: 'AIP', gpu_model: 'B300', gpu_count: 128 },
  { environment: 'AIP학습', gpu_model: 'A100', gpu_count: 320 },
  { environment: 'AIP학습', gpu_model: 'V100', gpu_count: 192 },
  { environment: 'AIP학습', gpu_model: 'MI355X', gpu_count: 96 },
  { environment: 'AI 학습 인프라', gpu_model: 'A100', gpu_count: 256 },
  { environment: 'AI 학습 인프라', gpu_model: 'P100', gpu_count: 160 },
  { environment: 'AI 학습 인프라', gpu_model: 'P40', gpu_count: 96 },
  { environment: 'DS Cloud', gpu_model: 'H100', gpu_count: 365 },
  { environment: 'DS Cloud', gpu_model: 'RTX Pro 6000', gpu_count: 240 },
  { environment: 'DS Cloud', gpu_model: 'V100', gpu_count: 192 },
];

/* ---- GET /api/service/summary ---- */
export const serviceSummary: ServiceSummary = {
  services: [
    { service_id: 'SVC001', service_name: 'GenAI Chat', service_group_id: 'GRP001', service_group_name: 'Chat Services', avg_input: 1024000, avg_output: 2048000, avg_total: 3072000 },
    { service_id: 'SVC002', service_name: 'Code Assist', service_group_id: 'GRP001', service_group_name: 'Chat Services', avg_input: 512000, avg_output: 768000, avg_total: 1280000 },
  ],
  day_count: 30,
};

/* ---- GET /api/service/timeseries (30 days × services) ---- */
export const serviceTimeseries: ServiceTimeseriesPoint[] = serviceSummary.services.flatMap(
  (svc, si) => {
    const r = rng(500 + si);
    return Array.from({ length: 30 }, (_, d) => {
      const day = String(d + 1).padStart(2, '0');
      return {
        service_id: svc.service_id,
        service_name: svc.service_name,
        ts: `2026-05-${day}`,
        total_tokens: Math.round((40 + r() * 30 + Math.sin(d / 4) * 8) * 1_000_000),
      };
    });
  },
);

/* ---- GET /api/filters ---- */
export const filters: Filters = {
  divisions: DIVISIONS,
  importance: IMPORTANCE,
  is_critical: ['Y', 'N'],
};

/* ---- 사용추이 — DERIVED: per day, the mean across the filtered pool ----
   (one fact table → the chart, its 평균 stats, the KPI cards and the rank
   lists all describe the same projects over the same 기간 window). */
export function getUtilTrend(f: GlobalFilters): Record<TaskType, UtilTrendPoint[]> {
  const n = PERIOD_DAYS[f.period];
  const pool = filterProjects(f);
  const trendFor = (t: TaskType): UtilTrendPoint[] => {
    const ps = pool.filter((p) => p.member_tasks.includes(t));
    const dayIdx = Array.from({ length: DAYS }, (_, d) => d).slice(DAYS - n);
    return dayIdx.map((d) => ({
      ts: DATES[d],
      gpu_ut: round1(
        mean(ps.map((p) => (t === '학습' ? projectDaily[p.project_id].train : projectDaily[p.project_id].gpu)[d])),
      ),
      slot_ut: round1(mean(ps.map((p) => projectDaily[p.project_id].slot[d]))),
    }));
  };
  return { 추론: trendFor('추론'), 학습: trendFor('학습') };
}

/** Legacy default-filter view. */
export const utilTrendByTask: Record<TaskType, UtilTrendPoint[]> = getUtilTrend(DEFAULT_FILTERS);

/** Mean of a numeric field across a trend series (for the chart's stat header). */
export const trendAvg = (pts: UtilTrendPoint[], key: 'gpu_ut' | 'slot_ut') =>
  round1(pts.reduce((s, p) => s + p[key], 0) / pts.length);
