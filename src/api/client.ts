/**
 * 실 백엔드 fetch 래퍼 — 사내 frontend/src/api.js 의 TS 포팅 (HANDOFF §4-1).
 * BASE = VITE_API_BASE(기본 '/board/api'), AbortController 30s 타임아웃,
 * 쿼리 빌더는 null/''/'ALL' 값을 제거한다.
 *
 * 응답의 "원시(raw)" 형태는 src/api/adapters.ts 의 Raw* 타입으로 문서화되고,
 * 화면 계약(mock/types.ts)으로의 변환은 adapter가 담당한다.
 */
import { API_BASE } from '../lib/env';
import { PERIOD_DAYS, type GlobalFilters } from '../mock/data';
import type { QuotaByEnvGpu, ServiceTimeseriesPoint, TaskType } from '../mock/types';
import type {
  RawFilters,
  RawKpiByTask,
  RawProjectsResponse,
  RawProjectUnitsResponse,
  RawRankByTask,
  RawServiceSummary,
  RawUtilTrend,
} from './adapters';

const TIMEOUT_MS = 30_000;

type ParamValue = string | number | undefined | null;

/** null/''/'ALL' 값을 버리는 쿼리 빌더 (api.js와 동일 규칙). */
function buildQuery(params: Record<string, ParamValue>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === 'ALL') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function get<T>(path: string, params: Record<string, ParamValue> = {}): Promise<T> {
  const url = `${API_BASE}${path}${buildQuery(params)}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} — GET ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GlobalFilters → backend 쿼리 파라미터 (HANDOFF §4-1):
 * period('최근 N일') → days(숫자), division('전체' → 생략),
 * taskClass('전략' → is_critical=Y · '일반' → N · '전체' → 생략).
 */
export function filterParams(f: GlobalFilters): Record<string, ParamValue> {
  return {
    days: PERIOD_DAYS[f.period],
    division: f.division === '전체' ? undefined : f.division,
    is_critical: f.taskClass === '전략' ? 'Y' : f.taskClass === '일반' ? 'N' : undefined,
  };
}

/** 엔드포인트 목록은 사내 api.js와 동일 (HANDOFF §2의 13개 중 화면이 쓰는 것). */
export const api = {
  health: () => get<{ status: string }>('/health'),
  filters: () => get<RawFilters>('/filters'),
  gpuCountByTask: (f: GlobalFilters) =>
    get<Record<string, number>>('/gpu-count-by-task', filterParams(f)),
  kpiByTask: (f: GlobalFilters) => get<RawKpiByTask[]>('/kpi-by-task', filterParams(f)),
  topBottom: (f: GlobalFilters) => get<RawRankByTask>('/top-bottom-projects', filterParams(f)),
  // TODO: 경로를 사내 openapi.yaml과 대조해 확정할 것 (api.js timeseriesByTask).
  timeseriesByTask: (f: GlobalFilters) => get<RawUtilTrend>('/timeseries-by-task', filterParams(f)),
  quotaByEnvGpu: () => get<QuotaByEnvGpu[]>('/quota-by-env-gpu'), // 🟢 계약과 동일 (HANDOFF §2)
  projects: (f: GlobalFilters) => get<RawProjectsResponse>('/projects', filterParams(f)),
  projectUnits: (projectId: string, task: TaskType, f: GlobalFilters) =>
    get<RawProjectUnitsResponse>('/project/units', {
      project_id: projectId,
      task,
      ...filterParams(f),
    }),
  serviceSummary: (f: GlobalFilters) => get<RawServiceSummary>('/service/summary', filterParams(f)),
  serviceTimeseries: (f: GlobalFilters) =>
    get<ServiceTimeseriesPoint[]>('/service/timeseries', filterParams(f)), // 🟢 여분 필드는 무시
};
