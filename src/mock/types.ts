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

/** GET /api/kpi-by-task */
export interface KpiByTask {
  task: TaskType;
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
  slot_ut: number;
  member_tasks: TaskType[];
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
