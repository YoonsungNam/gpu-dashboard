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
  ReclaimBasis,
  ServiceSummary,
  ServiceTimeseriesPoint,
  TaskType,
  UtilTrendPoint,
  YN,
} from './types';
import { gradeOf } from '../lib/gradePolicy';

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
// 용도 — 학습계(모델 학습/모델 개발) + 추론계(생산시스템 연계/일반); 등급 정책의 키와 1:1.
const TRAIN_PURPOSES = ['모델 학습', '모델 개발'];
const INFER_PURPOSES = ['생산시스템 연계', '일반'];
const PURPOSES = [...TRAIN_PURPOSES, ...INFER_PURPOSES];
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

/** The 28-day fact window every aggregate derives from. */
export const DAYS = 28;
export const DATES = Array.from({ length: DAYS }, (_, d) => `2026-05-${String(4 + d).padStart(2, '0')}`);

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const tail = <T,>(xs: T[], n: number) => xs.slice(Math.max(0, xs.length - n));

/* ---- GET /api/gpu-count-by-task ---- */
export const gpuCountByTask: GpuCountByTask = { 추론: 1842, 학습: 576 };

/* ---- GET /api/projects ----
   Sized so that per-task counts MATCH the Overview KPI cards exactly:
   81 dual-task + 766 추론-only + 153 학습-only → 추론 847 · 학습 234 (총 1,000).
   The first 24 keep the familiar base names; later rows get a numeric suffix.
   Grade comes from the shared purpose-aware rule in lib/util.ts. */
const DUAL_TASK = 81;
const INFERENCE_ONLY = 766;
const TRAINING_ONLY = 153;

export const projects: ProjectRow[] = Array.from(
  { length: DUAL_TASK + INFERENCE_ONLY + TRAINING_ONLY },
  (_, i) => {
    const r = rng(1000 + i);
    const slot = round1(20 + r() * 78);
    const gpu = round1(8 + r() * 88);
    const tasks: TaskType[] =
      i < DUAL_TASK ? ['추론', '학습'] : i < DUAL_TASK + INFERENCE_ONLY ? ['추론'] : ['학습'];
    const base = PROJECT_NAMES[i % PROJECT_NAMES.length];
    const name =
      i < PROJECT_NAMES.length
        ? base
        : `${base} ${String(Math.floor(i / PROJECT_NAMES.length)).padStart(2, '0')}`;
    // Task-affine 용도: 추론 전용 → 추론계, 학습 전용 → 학습계, 듀얼 → 전체 풀.
    const purpose =
      i < DUAL_TASK
        ? pick(r, PURPOSES)
        : i < DUAL_TASK + INFERENCE_ONLY
          ? pick(r, INFER_PURPOSES)
          : pick(r, TRAIN_PURPOSES);
    return {
      project_id: `PRJ${String(i + 1).padStart(4, '0')}`,
      project_name: name,
      division: pick(r, DIVISIONS),
      purpose,
      business_importance: pick(r, IMPORTANCE),
      is_critical: (r() > 0.7 ? 'Y' : 'N') as YN,
      user_id: pick(r, ['hong.gil.dong', 'kim.cs', 'lee.yh', 'park.jm', 'choi.sw']),
      quota: pick(r, [16, 32, 64, 128, 256]),
      inference_gpu_ut: gpu,
      inference_gpu_ut_working: round1(Math.min(100, gpu + 8)),
      inference_gpu_ut_nonworking: round1(Math.max(0, gpu - 16)),
      training_gpu_ut: round1(Math.max(0, Math.min(100, gpu + (r() - 0.5) * 24))),
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
      const wave = (base: number, d: number, amp: number, phase: number) =>
        clampPct(base + (r() - 0.5) * amp + Math.sin((d + phase) / 3.1) * (amp / 3));
      return [
        p.project_id,
        {
          gpu: Array.from({ length: DAYS }, (_, d) => wave(p.inference_gpu_ut, d, 16, i % 7)),
          train: Array.from({ length: DAYS }, (_, d) =>
            wave(p.training_gpu_ut ?? p.inference_gpu_ut, d, 18, (i + 3) % 7),
          ),
          slot: Array.from({ length: DAYS }, (_, d) => wave(p.slot_ut, d, 12, (i + 5) % 7)),
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

/** v2: reclaim estimate for one basis — 0 reclaim when current meets target. */
function reclaimBasis(current: number, target: number, quota: number): ReclaimBasis {
  const reclaim = current >= target ? 0 : Math.round(quota * (1 - current / target));
  return {
    current_pct: current,
    target_pct: target,
    reclaim_count: reclaim,
    total_count: quota,
    remaining_count: quota - reclaim,
  };
}

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
  const unitCount = 2 + Math.floor(r() * 3);
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
      gpu_num: pick(r, [8, 16, 32, 64]),
      unit_quota: pick(r, [8, 16, 32, 64]),
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
      // Same window means as the row/KPI strip (gpu target 30, slot target 70).
      reclaim_estimate: {
        gpu: reclaimBasis(u.gpu, 30, p.quota),
        slot: reclaimBasis(u.slot, 70, p.quota),
      },
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
