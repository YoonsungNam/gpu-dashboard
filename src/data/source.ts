/**
 * DataSource — facade가 노출하는 데이터 진입점의 공통 시그니처 (HANDOFF §4-3).
 * mockSource(기본)와 realSource(실 API)가 같은 인터페이스를 구현하므로,
 * USE_MOCK 토글이 어느 쪽이든 screens 코드는 변하지 않는다.
 * 실 API가 비동기이므로 모든 메서드는 Promise를 반환한다 (mock은 즉시 resolve).
 */
import type {
  Filters,
  KpiByTask,
  ProjectRow,
  ProjectUnitsResponse,
  QuotaByEnvGpu,
  ServiceTimeseriesPoint,
  TaskType,
  UtilTrendPoint,
} from '../mock/types';
import type { GlobalFilters, TaskRank } from '../mock/data';
import type { TokenView } from '../mock/tokens';

export interface DataSource {
  /** 헤더 셀렉트 옵션 (사업부 목록 등). */
  getFilters(): Promise<Filters>;
  getKpiByTask(f: GlobalFilters): Promise<KpiByTask[]>;
  getRankByTask(f: GlobalFilters): Promise<Record<TaskType, TaskRank>>;
  getUtilTrend(f: GlobalFilters): Promise<Record<TaskType, UtilTrendPoint[]>>;
  /**
   * 활용 현황 테이블 행 — 헤더 필터가 적용되고, 행의 utilization 필드에
   * 이미 기간 창 평균이 "구워진" 상태로 온다 (실 backend /projects와 동일).
   * 화면은 행 필드만 읽으면 되고 행 단위 추가 호출이 없다.
   */
  getProjects(f: GlobalFilters): Promise<ProjectRow[]>;
  getProjectUnits(projectId: string, task: TaskType, f: GlobalFilters): Promise<ProjectUnitsResponse>;
  getQuotaByEnvGpu(): Promise<QuotaByEnvGpu[]>;
  getTokenView(f: GlobalFilters): Promise<TokenView>;
  getGroupSeries(groupId: string, f: GlobalFilters): Promise<ServiceTimeseriesPoint[]>;
}
