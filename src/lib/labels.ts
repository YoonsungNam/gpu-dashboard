import type { PolicyMetric } from './gradePolicy';

/**
 * Canonical utilization metric labels — EXACTLY as they appear in Figma.
 * `key` is the matching field on API objects (ProjectUnit / ProjectUnitInfo / etc.).
 * `metric` is the grade-policy metric the value is judged as (lib/gradePolicy.ts):
 * 'wh'/'ah' are distinct from 'gpu' so 용도별 임계가 올바른 지표에 걸립니다.
 */
export interface MetricDef {
  key: string;
  label: string;
  metric: PolicyMetric;
}

export const GPU_UTIL: MetricDef = { key: 'gpu_ut', label: 'GPU Util', metric: 'gpu' };
export const GPU_UTIL_WH: MetricDef = { key: 'gpu_ut_working', label: 'GPU Util WH', metric: 'wh' };
export const GPU_UTIL_AH: MetricDef = { key: 'gpu_ut_nonworking', label: 'GPU Util AH', metric: 'ah' };
export const SLOT_UTIL: MetricDef = { key: 'slot_ut', label: 'Slot Util', metric: 'slot' };

/** The four utilization metrics in display order (used by tables & strips). */
export const UTIL_METRICS: MetricDef[] = [GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL];
