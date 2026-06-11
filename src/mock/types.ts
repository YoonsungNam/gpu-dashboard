/**
 * API response contracts — THE INTEGRATION SEAM.
 *
 * Field names mirror the real backend JSON 1:1 (see the API samples in
 * design-spec.md §7). When porting into the internal repo, the app maps its
 * real API responses onto these types; components never fetch — they take
 * these shapes as props.
 */

export type YN = 'Y' | 'N';
export type TaskType = '추론' | '학습';

/** v2 design: per-project utilization grade (drives 워크그룹-cell chips + 등급 필터). */
export type ProjectGrade = '우수' | '저활용';

/** GET /api/kpi-by-task */
export interface KpiByTask {
  task: TaskType;
  /** 과제별 할당 quota 합 — Overview 'GPUs'와 자원 Summary '총 GPU 수량'의 단일 소스. */
  gpu_total: number;
  avg_slot_ut: number;
  avg_gpu_ut: number;
  avg_gpu_ut_working?: number;
  avg_gpu_ut_nonworking?: number;
  project_count: number;
}

/** GET /api/gpu-count-by-task → { "추론": n, "학습": n } */
export type GpuCountByTask = Record<string, number>;

/** GET /api/top-bottom-projects */
export interface RankedProject {
  project_id: string;
  project_name: string;
  division: string;
  /** 용도 — 점검 배지 색이 (태스크 × 용도) 임계로 판정되므로 필요. */
  purpose: string;
  is_critical: YN;
  quota: number;
  slot_ut: number;
  gpu_ut: number;
  reason: string;
}
export interface TopBottomProjects {
  good: RankedProject[];
  alert: RankedProject[];
}

/** GET /api/projects */
export interface ProjectRow {
  project_id: string;
  project_name: string;
  division: string;
  purpose: string;
  business_importance: string;
  is_critical: YN;
  user_id: string;
  quota: number;
  inference_gpu_ut: number;
  inference_gpu_ut_working?: number;
  inference_gpu_ut_nonworking?: number;
  /** v2: training-scoped GPU Util shown on the 학습 tab. */
  training_gpu_ut?: number;
  slot_ut: number;
  member_tasks: TaskType[];
  /** v2: utilization grade chip (null = no chip). */
  grade?: ProjectGrade | null;
}

/**
 * v2: target-vs-current reclaim estimate for one basis (GPU Util / Slot Util).
 * reclaim_count 0 → render the '이 기준 회수 없음' state.
 */
export interface ReclaimBasis {
  current_pct: number;
  target_pct: number;
  reclaim_count: number;
  total_count: number;
  remaining_count: number;
}

/** GET /api/project/units?project_id=… */
export interface ProjectUnitInfo {
  project_name: string;
  division: string;
  purpose: string;
  business_importance: string;
  slot_ut: number;
  gpu_ut: number;
  gpu_ut_working?: number;
  gpu_ut_nonworking?: number;
  /** v2: feeds the '저활용 회수 예상량' gauges in the expanded detail. */
  reclaim_estimate?: { gpu: ReclaimBasis; slot: ReclaimBasis };
}
export interface ProjectUnit {
  unit_id: string;
  unit_name: string;
  task: TaskType;
  gpu_model: string;
  gpu_num: number;
  unit_quota: number;
  slot_ut: number;
  gpu_ut: number;
  gpu_ut_working?: number;
  gpu_ut_nonworking?: number;
}
export interface ProjectUnitsResponse {
  info: ProjectUnitInfo;
  units: ProjectUnit[];
}

/** GET /api/quota-by-env-gpu */
export interface QuotaByEnvGpu {
  environment: string;
  gpu_model: string;
  gpu_count: number;
}

/** GET /api/service/summary */
export interface ServiceSummaryItem {
  service_id: string;
  service_name: string;
  service_group_id: string;
  service_group_name: string;
  avg_input: number;
  avg_output: number;
  avg_total: number;
}
export interface ServiceSummary {
  services: ServiceSummaryItem[];
  day_count: number;
}

/** GET /api/service/timeseries */
export interface ServiceTimeseriesPoint {
  service_id: string;
  service_name: string;
  ts: string; // YYYY-MM-DD
  total_tokens: number;
}

/* ------------------------------------------------------------------ */
/* v2 — 토큰 활용 현황 (service-group token usage)                       */
/* ------------------------------------------------------------------ */

/** One service inside a group (GET /api/token/groups → services[]). */
export interface TokenServiceItem {
  service_id: string;
  service_name: string;
  /** Serving model label shown in the 서비스 전체 modal (e.g. 'GPT-OSS'). */
  model: string;
  /** Token share within its group, 0–100. */
  share_pct: number;
  avg_input: number;
  avg_output: number;
  avg_total: number;
}

/** GET /api/token/groups — one service-group rollup row. */
export interface TokenGroupSummary {
  service_group_id: string;
  service_group_name: string;
  division: string;
  service_count: number;
  /** Share of all token traffic, 0–100. */
  share_pct: number;
  avg_input: number;
  avg_output: number;
  avg_total: number;
  /** Sorted by share_pct desc; UI shows the first 3–5, rest behind 더보기. */
  services: TokenServiceItem[];
}

/** GET /api/token/totals — KPI strip numbers. */
export interface TokenTotals {
  group_count: number;
  service_count: number;
  avg_total: number;
  day_count: number;
}

/** GET /api/filters */
export interface Filters {
  divisions: string[];
  importance: string[];
  is_critical: YN[];
}

/**
 * Utilization-over-time for the 사용추이 trend chart.
 * NOTE: no endpoint sample was provided for this; shape is assumed
 * (frontend-derived). Adjust when the real util-timeseries endpoint is known.
 */
export interface UtilTrendPoint {
  ts: string; // YYYY-MM-DD
  gpu_ut: number;
  slot_ut: number;
}
