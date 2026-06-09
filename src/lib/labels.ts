import type { UtilMetric } from './util';

/**
 * Canonical utilization metric labels — EXACTLY as they appear in Figma.
 * `key` is the matching field on API objects (ProjectUnit / ProjectUnitInfo / etc.).
 */
export interface MetricDef {
  key: string;
  label: string;
  metric: UtilMetric;
}

export const GPU_UTIL: MetricDef = { key: 'gpu_ut', label: 'GPU Util', metric: 'gpu' };
export const GPU_UTIL_WH: MetricDef = { key: 'gpu_ut_working', label: 'GPU Util WH', metric: 'gpu' };
export const GPU_UTIL_AH: MetricDef = { key: 'gpu_ut_nonworking', label: 'GPU Util AH', metric: 'gpu' };
export const SLOT_UTIL: MetricDef = { key: 'slot_ut', label: 'Slot Util', metric: 'slot' };

/** The four utilization metrics in display order (used by tables & strips). */
export const UTIL_METRICS: MetricDef[] = [GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL];
