/**
 * DataSource의 실 API 구현 (VITE_USE_MOCK=false) — client fetch → adapter.
 * 사내 backend(/board/api)가 있어야 동작한다 (dev는 vite proxy, HANDOFF §4-4).
 */
import type { DataSource } from './source';
import { api } from '../api/client';
import { PERIOD_DAYS } from '../mock/data';
import {
  adaptFilters,
  adaptKpiByTask,
  adaptProjects,
  adaptProjectUnits,
  adaptRank,
  adaptUtilTrend,
  rollupGroupSeries,
  rollupTokenView,
} from '../api/adapters';

export const realSource: DataSource = {
  getFilters: () => api.filters().then(adaptFilters),

  // TODO(HANDOFF §2 🔴): backend /kpi-by-task 가 gpu_total을 주면 /projects
  // 동시 호출 폴백을 제거하고 adaptKpiByTask(kpi)만 남길 것.
  getKpiByTask: async (f) => {
    const [kpi, projects] = await Promise.all([api.kpiByTask(f), api.projects(f)]);
    return adaptKpiByTask(kpi, adaptProjects(projects));
  },

  getRankByTask: (f) => api.topBottom(f).then(adaptRank),
  getUtilTrend: (f) => api.timeseriesByTask(f).then(adaptUtilTrend),
  getProjects: (f) => api.projects(f).then(adaptProjects),
  getProjectUnits: (projectId, task, f) =>
    api.projectUnits(projectId, task, f).then((raw) => adaptProjectUnits(raw, task)),
  getQuotaByEnvGpu: () => api.quotaByEnvGpu(), // 🟢 계약과 1:1 (HANDOFF §2)

  // HANDOFF §3 (B) 프론트 집계 — TODO: /token/groups 생기면 (A)로 교체.
  getTokenView: async (f) => rollupTokenView(await api.serviceSummary(f), PERIOD_DAYS[f.period]),
  getGroupSeries: async (groupId, f) => {
    const [summary, points] = await Promise.all([api.serviceSummary(f), api.serviceTimeseries(f)]);
    return rollupGroupSeries(points, rollupTokenView(summary, PERIOD_DAYS[f.period]), groupId);
  },
};
