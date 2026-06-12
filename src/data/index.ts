/**
 * Data facade — screens의 유일한 데이터 진입점 (HANDOFF.md §1·§4·§6).
 *
 * screens는 '../mock/*' 를 직접 import하지 않고 반드시 이 모듈을 거친다.
 * 지금은 mock 구현을 그대로 재노출(re-export)하는 골격이고, 실 API 연결(포팅
 * 단계 2)에서는 lib/env.ts 의 USE_MOCK 에 따라 이 모듈 내부가
 * "fetch(api/client.ts) + adapter(api/adapters.ts)" 경로로 분기한다 —
 * 토글이 어느 쪽이든 screens/컴포넌트 코드는 변하지 않는 것이 원칙.
 *
 * mock/* 파일은 삭제 금지: USE_MOCK(기본) 모드의 구현이자 디자이너 standalone
 * 실행·오프라인 fallback이다.
 */

// ---- GPU (Overview · GPU 활용 현황) ----
export {
  type GlobalFilters,
  type PeriodKey,
  type TaskClass,
  type TaskRank,
  DEFAULT_FILTERS,
  PERIOD_DAYS,
  getKpiByTask,
  getRankByTask,
  getUtilTrend,
  getProjectUnits,
  filterProjects,
  projectUtil,
  quotaByEnvGpu,
  trendAvg,
} from '../mock/data';

// ---- 토큰 활용 현황 ----
export {
  type TokenView,
  type TokenChartFeed,
  getTokenView,
  getGroupSeries,
  pivotTokenSeries,
} from '../mock/tokens';
