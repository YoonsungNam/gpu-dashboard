/**
 * DataSource의 mock 구현 (USE_MOCK 기본 모드) — 디자이너 standalone 실행과
 * 오프라인 fallback. mock/* 의 동기 함수를 같은 시그니처의 Promise로 감싼다.
 */
import type { DataSource } from './source';
import type { GlobalFilters } from '../mock/data';
import type { ProjectRow } from '../mock/types';
import {
  filterProjects,
  getKpiByTask,
  getProjectUnits,
  getRankByTask,
  getUtilTrend,
  projectUtil,
  quotaByEnvGpu,
  filters as mockFilters,
} from '../mock/data';
import { getGroupSeries, getTokenView } from '../mock/tokens';

/**
 * 행의 utilization 필드에 기간 창 평균을 "구워서" 반환 — 실 backend /projects
 * 응답과 같은 모양. KPI/랭킹/펼침 상세와 같은 projectUtil 창 평균을 쓰므로
 * 화면 간 정합성은 그대로 유지된다.
 */
function windowScopedProjects(f: GlobalFilters): ProjectRow[] {
  return filterProjects(f).map((p) => {
    const inf = p.member_tasks.includes('추론') ? projectUtil(p, '추론', f) : null;
    const tr = p.member_tasks.includes('학습') ? projectUtil(p, '학습', f) : null;
    return {
      ...p,
      inference_gpu_ut: inf?.gpu ?? p.inference_gpu_ut,
      inference_gpu_ut_working: inf?.wh ?? p.inference_gpu_ut_working,
      inference_gpu_ut_nonworking: inf?.ah ?? p.inference_gpu_ut_nonworking,
      training_gpu_ut: tr?.gpu ?? p.training_gpu_ut,
      slot_ut: (inf ?? tr)?.slot ?? p.slot_ut,
    };
  });
}

export const mockSource: DataSource = {
  getFilters: () => Promise.resolve(mockFilters),
  getKpiByTask: (f) => Promise.resolve(getKpiByTask(f)),
  getRankByTask: (f) => Promise.resolve(getRankByTask(f)),
  getUtilTrend: (f) => Promise.resolve(getUtilTrend(f)),
  getProjects: (f) => Promise.resolve(windowScopedProjects(f)),
  getProjectUnits: (projectId, task, f) => Promise.resolve(getProjectUnits(projectId, task, f)),
  getQuotaByEnvGpu: () => Promise.resolve(quotaByEnvGpu),
  getTokenView: (f) => Promise.resolve(getTokenView(f)),
  getGroupSeries: (groupId, f) => Promise.resolve(getGroupSeries(groupId, f)),
};
