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
  ReclaimBasis,
  ServiceSummary,
  ServiceTimeseriesPoint,
  TaskType,
  TopBottomProjects,
  UtilTrendPoint,
  YN,
} from './types';
import { projectGrade } from '../lib/util';

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

const DIVISIONS = ['DX', 'Platform', 'Security', 'Foundry', 'Memory'];
const IMPORTANCE = ['전략', '핵심', '일반'];
const PURPOSES = ['모델 학습', '모델 개발'];
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
    const purpose = pick(r, PURPOSES);
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
      grade: projectGrade(purpose, gpu, slot) as ProjectGrade | null,
    };
  },
);

/** Per-task project totals — ONE source for Overview cards AND the 활용 현황 tabs. */
const projectCountByTask = (t: TaskType) =>
  projects.filter((p) => p.member_tasks.includes(t)).length;

/* ---- GET /api/kpi-by-task (project_count derived from `projects`) ---- */
export const kpiByTask: KpiByTask[] = [
  {
    task: '추론',
    avg_slot_ut: 72.3,
    avg_gpu_ut: 38.5,
    avg_gpu_ut_working: 45.2,
    avg_gpu_ut_nonworking: 22.1,
    project_count: projectCountByTask('추론'),
  },
  {
    task: '학습',
    avg_slot_ut: 82.1,
    avg_gpu_ut: 55.3,
    avg_gpu_ut_working: 64.3,
    avg_gpu_ut_nonworking: 31.2,
    project_count: projectCountByTask('학습'),
  },
];

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
export function getProjectUnits(projectId: string, task: TaskType = '추론'): ProjectUnitsResponse {
  const p = projects.find((x) => x.project_id === projectId) ?? projects[0];
  const gpuUt = task === '학습' ? p.training_gpu_ut ?? p.inference_gpu_ut : p.inference_gpu_ut;
  const r = rng(parseInt(projectId.replace(/\D/g, '') || '1', 10) * 7 + 3);
  const unitCount = 2 + Math.floor(r() * 3);
  const units = Array.from({ length: unitCount }, (_, i) => {
    const gpu = round1(10 + r() * 88);
    // v2 unit naming: 'ais-{사업부}-serve-NN'
    const div = pick(r, ['mx', 'vd', 'dx', 'sr']);
    return {
      unit_id: `U${String(i + 1).padStart(3, '0')}`,
      unit_name: `ais-${div}사업부-serve-${String(i + 1).padStart(2, '0')}`,
      task: (r() > 0.5 ? '추론' : '학습') as TaskType,
      gpu_model: pick(r, GPU_MODELS),
      gpu_num: pick(r, [8, 16, 32, 64]),
      unit_quota: pick(r, [8, 16, 32, 64]),
      slot_ut: round1(30 + r() * 68),
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
      slot_ut: p.slot_ut,
      gpu_ut: gpuUt,
      gpu_ut_working: p.inference_gpu_ut_working,
      gpu_ut_nonworking: p.inference_gpu_ut_nonworking,
      // Same task-scoped gpu value as info.gpu_ut so the gauges' '현재 X%'
      // equals the KPI strip exactly (gpu target 30, slot target 70).
      reclaim_estimate: {
        gpu: reclaimBasis(gpuUt, 30, p.quota),
        slot: reclaimBasis(p.slot_ut, 70, p.quota),
      },
    },
    units,
  };
}

/* ---- GET /api/top-bottom-projects ----
   Lists are sourced from the SAME grade rule as the 활용 현황 chips:
   good = graded 우수 (top 10 by GPU Util), alert = graded 저활용 (worst 12). */
export const topBottomProjects: TopBottomProjects = {
  good: projects
    .filter((p) => p.grade === '우수')
    .sort((a, b) => b.inference_gpu_ut - a.inference_gpu_ut)
    .slice(0, 10)
    .map((p) => ({
      project_id: p.project_id,
      project_name: p.project_name,
      division: p.division,
      is_critical: p.is_critical,
      quota: p.quota,
      slot_ut: p.slot_ut,
      gpu_ut: p.inference_gpu_ut,
      reason: `GPU Util ${p.inference_gpu_ut.toFixed(1)}%`,
    })),
  alert: projects
    .filter((p) => p.grade === '저활용')
    .sort((a, b) => a.inference_gpu_ut - b.inference_gpu_ut)
    .slice(0, 12)
    .map((p) => ({
      project_id: p.project_id,
      project_name: p.project_name,
      division: p.division,
      is_critical: p.is_critical,
      quota: p.quota,
      slot_ut: p.slot_ut,
      gpu_ut: p.inference_gpu_ut,
      reason: `Slot Util ${p.slot_ut.toFixed(1)}%`,
    })),
};

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

/* ---- util-over-time for 사용추이 (assumed shape; no endpoint sample) ----
   Most recent 28 days (2026-05-04..2026-05-31) — matches the '최근 28일' default. */
function genTrend(seed: number, gpuAvg: number, slotAvg: number): UtilTrendPoint[] {
  const r = rng(700 + seed);
  return Array.from({ length: 28 }, (_, d) => {
    const day = String(d + 4).padStart(2, '0');
    return {
      ts: `2026-05-${day}`,
      gpu_ut: round1(Math.max(0, Math.min(100, gpuAvg + (r() - 0.5) * 22 + Math.sin(d / 5) * 6))),
      slot_ut: round1(Math.max(0, Math.min(100, slotAvg + (r() - 0.5) * 16 + Math.cos(d / 6) * 5))),
    };
  });
}

export const utilTrendByTask: Record<TaskType, UtilTrendPoint[]> = {
  추론: genTrend(1, 46.4, 61.2),
  학습: genTrend(2, 55.3, 82.1),
};

/** Mean of a numeric field across a trend series (for the chart's stat header). */
export const trendAvg = (pts: UtilTrendPoint[], key: 'gpu_ut' | 'slot_ut') =>
  round1(pts.reduce((s, p) => s + p[key], 0) / pts.length);
