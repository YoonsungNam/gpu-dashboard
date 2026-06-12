/**
 * Data facade — screens의 유일한 데이터 진입점 (HANDOFF.md §1·§4·§6).
 *
 * VITE_USE_MOCK(기본 'true')에 따라 같은 시그니처(DataSource)의 두 구현 중
 * 하나를 노출한다:
 *   - mockSource: mock/* 동기 구현을 Promise로 감싼 것 (디자이너 standalone)
 *   - realSource: api/client.ts fetch → api/adapters.ts 변환 (사내 backend)
 * 토글이 어느 쪽이든 screens/컴포넌트 코드는 변하지 않는다 — 비동기 로드는
 * useData 훅(Promise.all 일괄 로드 + race-id)으로 흡수한다.
 *
 * mock/* 파일은 삭제 금지: 기본 모드의 구현이자 오프라인 fallback이다.
 */
import { USE_MOCK } from '../lib/env';
import type { DataSource } from './source';
import { mockSource } from './mockSource';
import { realSource } from './realSource';

const source: DataSource = USE_MOCK ? mockSource : realSource;

export const {
  getFilters,
  getKpiByTask,
  getRankByTask,
  getUtilTrend,
  getProjects,
  getProjectUnits,
  getQuotaByEnvGpu,
  getTokenView,
  getGroupSeries,
} = source;

export type { DataSource } from './source';
export { useData, type UseDataState } from './useData';

// ---- 순수 헬퍼·상수·타입 (데이터 소스와 무관 — 양 모드 공통) ----
export {
  type GlobalFilters,
  type PeriodKey,
  type TaskClass,
  type TaskRank,
  DEFAULT_FILTERS,
  PERIOD_DAYS,
  trendAvg,
} from '../mock/data';
export { type TokenView, type TokenChartFeed, pivotTokenSeries } from '../mock/tokens';
