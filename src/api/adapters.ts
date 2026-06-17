/**
 * backend 원시 JSON → 화면 계약(src/mock/types.ts) 어댑터 (HANDOFF §2·§4-2).
 *
 * - Raw* 타입은 사내 openapi.yaml 예시를 기반으로 한 "가정"의 문서화다.
 *   TODO: 사내 openapi.yaml과 키 이름을 대조해 확정할 것 (특히 동적 태스크 키와
 *   quota 키 — fixtures.ts 가 이 가정의 실행 가능한 사양이다).
 * - 등급/회수 로직은 lib/gradePolicy.ts(gradeOf·reclaimEstimate)를 재사용한다 —
 *   mock과 실 API가 같은 정책 구현을 지나므로 판정이 갈라질 수 없다 (중복 금지).
 * - 토큰 그룹 롤업은 HANDOFF §3의 (B) 프론트 집계.
 *   TODO: backend /token/groups·/token/totals 가 생기면 (A) 서버 집계로 교체.
 */
import type {
  Filters,
  KpiByTask,
  ProjectRow,
  ProjectUnit,
  ProjectUnitInfo,
  ProjectUnitsResponse,
  RankedProject,
  ServiceTimeseriesPoint,
  TaskType,
  TokenGroupSummary,
  TokenServiceItem,
  UtilTrendPoint,
  YN,
} from '../mock/types';
import type { TaskRank } from '../mock/data';
import type { TokenView } from '../mock/tokens';
import { gradeOf, reclaimEstimate, type GradeValues } from '../lib/gradePolicy';

const TASKS: TaskType[] = ['추론', '학습'];
const round1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */
/* Raw 응답 형태 (가정 — openapi.yaml 예시 기반)                          */
/* ------------------------------------------------------------------ */

/** GET /projects — 동적 태스크 키('추론_gpu_ut', '학습_gpu_total' …)를 가진 행. */
export interface RawProject {
  project_id: string;
  project_name: string;
  division: string;
  purpose?: string;
  business_importance?: string;
  is_critical?: YN;
  user_id?: string;
  quota?: number;
  slot_ut?: number;
  /** '추론_gpu_ut' · '추론_gpu_ut_working' · '학습_gpu_ut' · '학습_gpu_total' … */
  [dynamicKey: string]: unknown;
}
/** backend 응답은 {projects, tasks} 래퍼 (HANDOFF §2 🟡). */
export interface RawProjectsResponse {
  projects: RawProject[];
  tasks?: string[];
}

/** GET /top-bottom-projects — task별 "전체" 배열 (good/alert 미분류). */
export interface RawRankedProject {
  project_id: string;
  project_name: string;
  division: string;
  purpose?: string;
  is_critical?: YN;
  quota?: number;
  gpu_ut: number;
  gpu_ut_working?: number;
  slot_ut: number;
  reason?: string;
}
export type RawRankByTask = Record<string, RawRankedProject[]>;

/** GET /kpi-by-task — gpu_total은 backend에 아직 없음 (HANDOFF §2 🔴). */
export interface RawKpiByTask {
  task: TaskType;
  avg_gpu_ut: number;
  avg_slot_ut: number;
  avg_gpu_ut_working?: number;
  avg_gpu_ut_nonworking?: number;
  project_count: number;
  gpu_total?: number;
}

/** GET /project/units — info/units 구조는 계약과 동일, reclaim_estimate만 없음. */
export interface RawProjectUnitsResponse {
  info: Omit<ProjectUnitInfo, 'reclaim_estimate'>;
  units: ProjectUnit[];
}

/** GET /filters — {divisions, tasks, importance}; is_critical 목록은 없음. */
export interface RawFilters {
  divisions: string[];
  tasks?: string[];
  importance?: string[];
}

/** GET /timeseries-by-task — task별 레코드 또는 task 필드가 달린 평탄 배열. */
export type RawUtilTrend =
  | Record<string, UtilTrendPoint[]>
  | Array<UtilTrendPoint & { task: TaskType }>;

/** GET /service/summary — 서비스 단위 합계 (그룹 롤업의 원재료, HANDOFF §3). */
export interface RawServiceSummaryItem {
  service_id: string;
  service_name: string;
  service_group_id: string;
  service_group_name: string;
  division?: string;
  model?: string;
  avg_input: number;
  avg_output: number;
  avg_total?: number;
  [extra: string]: unknown; // input_tokens 등 여분 필드는 drop (HANDOFF §2 🟡)
}
export interface RawServiceSummary {
  services: RawServiceSummaryItem[];
  day_count?: number;
}

/* ------------------------------------------------------------------ */
/* 어댑터                                                                */
/* ------------------------------------------------------------------ */

/** 동적 키에서 첫 번째 유한 숫자를 꺼낸다. */
function numOf(p: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

/** 행의 등급 판정 입력 — adapter와 화면(rowGrade)이 같은 모양을 쓴다. */
function gradeValuesOf(task: TaskType, p: ProjectRow): GradeValues {
  const gpu = task === '학습' ? p.training_gpu_ut ?? 0 : p.inference_gpu_ut;
  return {
    gpu,
    // TODO: backend가 WH를 안 주는 행은 GPU Util로 폴백 — openapi.yaml 확정 시 제거.
    wh: p.inference_gpu_ut_working ?? gpu,
    slot: p.slot_ut,
  };
}

/** {projects, tasks} 래퍼의 동적 키를 평탄 필드로, grade는 gradeOf()로 파생. */
export function adaptProjects(raw: RawProjectsResponse): ProjectRow[] {
  return raw.projects.map((p) => {
    const member_tasks = TASKS.filter((t) => numOf(p, `${t}_gpu_ut`) != null);
    const inferGpu = numOf(p, '추론_gpu_ut') ?? 0;
    const row: ProjectRow = {
      project_id: p.project_id,
      project_name: p.project_name,
      division: p.division,
      purpose: p.purpose ?? '',
      business_importance: p.business_importance ?? '일반',
      is_critical: p.is_critical ?? 'N',
      user_id: p.user_id ?? '',
      // TODO: quota 키 확정 필요 — quota / proj_quota / {task}_gpu_total 중 무엇인지.
      quota:
        numOf(p, 'quota', 'proj_quota') ??
        (numOf(p, '추론_gpu_total') ?? 0) + (numOf(p, '학습_gpu_total') ?? 0),
      inference_gpu_ut: inferGpu,
      inference_gpu_ut_working: numOf(p, '추론_gpu_ut_working'),
      inference_gpu_ut_nonworking: numOf(p, '추론_gpu_ut_nonworking'),
      training_gpu_ut: numOf(p, '학습_gpu_ut'),
      slot_ut: numOf(p, 'slot_ut', '추론_slot_ut', '학습_slot_ut') ?? 0,
      member_tasks: member_tasks.length ? member_tasks : ['추론'],
    };
    row.grade = gradeOf(row.member_tasks[0], row.purpose, gradeValuesOf(row.member_tasks[0], row));
    return row;
  });
}

/** task별 전체 배열을 gradeOf()로 {good, alert} 분류 (mock getRankByTask와 동일 규칙). */
export function adaptRank(raw: RawRankByTask): Record<TaskType, TaskRank> {
  const rankFor = (t: TaskType): TaskRank => {
    const graded = (raw[t] ?? []).map((r) => {
      const v: GradeValues = {
        gpu: r.gpu_ut,
        wh: r.gpu_ut_working ?? r.gpu_ut, // TODO: WH 미제공 시 폴백 (openapi 확정 시 제거)
        slot: r.slot_ut,
      };
      return { r, g: gradeOf(t, r.purpose ?? '', v) };
    });
    const toRanked = ({ r }: { r: RawRankedProject }): RankedProject => ({
      project_id: r.project_id,
      project_name: r.project_name,
      division: r.division,
      purpose: r.purpose ?? '',
      is_critical: r.is_critical ?? 'N',
      quota: r.quota ?? 0,
      slot_ut: r.slot_ut,
      gpu_ut: r.gpu_ut,
      reason: r.reason ?? `GPU Util ${r.gpu_ut.toFixed(1)}%`,
    });
    const good = graded.filter((x) => x.g === '우수').sort((a, b) => b.r.gpu_ut - a.r.gpu_ut);
    const alert = graded.filter((x) => x.g === '저활용').sort((a, b) => a.r.gpu_ut - b.r.gpu_ut);
    return {
      good_count: good.length,
      alert_count: alert.length,
      good: good.map(toRanked),
      alert: alert.map(toRanked),
    };
  };
  return { 추론: rankFor('추론'), 학습: rankFor('학습') };
}

/** info.reclaim_estimate를 reclaimConds 기반(reclaimEstimate)으로 파생해 부착. */
export function adaptProjectUnits(raw: RawProjectUnitsResponse, task: TaskType): ProjectUnitsResponse {
  const { info, units } = raw;
  const v: GradeValues = {
    gpu: info.gpu_ut,
    wh: info.gpu_ut_working ?? info.gpu_ut,
    slot: info.slot_ut,
  };
  // 회수 모수 = Unit 수량 합 (= 펼침 '수량' 카드와 동일 — 패널 내 자기일관성).
  const quota = units.reduce((s, u) => s + u.gpu_num, 0);
  return {
    info: { ...info, reclaim_estimate: reclaimEstimate(task, info.purpose, v, quota) },
    units,
  };
}

/**
 * gpu_total이 없으면 projects의 quota 합으로 보강.
 * TODO(HANDOFF §2 🔴): backend /kpi-by-task 에 gpu_total 추가되면 폴백 제거 —
 * 그때까지 실 모드 getKpiByTask는 /projects를 함께 불러 이 폴백을 채운다.
 */
export function adaptKpiByTask(raw: RawKpiByTask[], projectsForFallback?: ProjectRow[]): KpiByTask[] {
  const quotaOf = (task: TaskType) =>
    (projectsForFallback ?? [])
      .filter((p) => p.member_tasks.includes(task))
      .reduce((s, p) => s + p.quota, 0);
  return raw.map((k) => ({
    task: k.task,
    gpu_total: k.gpu_total ?? quotaOf(k.task),
    avg_gpu_ut: k.avg_gpu_ut,
    avg_gpu_ut_working: k.avg_gpu_ut_working,
    avg_gpu_ut_nonworking: k.avg_gpu_ut_nonworking,
    avg_slot_ut: k.avg_slot_ut,
    project_count: k.project_count,
  }));
}

/** {divisions, tasks, importance} → 계약 Filters (is_critical은 상수 주입). */
export function adaptFilters(raw: RawFilters): Filters {
  return {
    divisions: raw.divisions,
    importance: raw.importance ?? [],
    is_critical: ['Y', 'N'],
  };
}

/** task별 레코드/평탄 배열 양쪽을 Record<TaskType, UtilTrendPoint[]>로 정규화. */
export function adaptUtilTrend(raw: RawUtilTrend): Record<TaskType, UtilTrendPoint[]> {
  const out: Record<TaskType, UtilTrendPoint[]> = { 추론: [], 학습: [] };
  if (Array.isArray(raw)) {
    for (const p of raw) {
      if (out[p.task]) out[p.task].push({ ts: p.ts, gpu_ut: p.gpu_ut, slot_ut: p.slot_ut });
    }
  } else {
    for (const t of TASKS) out[t] = raw[t] ?? [];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 토큰 그룹 롤업 — HANDOFF §3 (B) 프론트 집계                            */
/* TODO: backend /token/groups·/token/totals 생기면 (A) 서버 집계로 교체   */
/* ------------------------------------------------------------------ */

/** /service/summary를 service_group_id로 롤업 (mock getTokenView 집계 로직 이식). */
export function rollupTokenView(raw: RawServiceSummary, fallbackDayCount: number): TokenView {
  const byGroup = new Map<string, { meta: RawServiceSummaryItem; services: TokenServiceItem[] }>();
  for (const sv of raw.services) {
    const avg_input = sv.avg_input;
    const avg_output = sv.avg_output;
    const item: TokenServiceItem = {
      service_id: sv.service_id,
      service_name: sv.service_name,
      model: sv.model ?? '-',
      share_pct: 0, // 그룹 합계 이후 채움
      avg_input,
      avg_output,
      avg_total: sv.avg_total ?? avg_input + avg_output,
    };
    const g = byGroup.get(sv.service_group_id);
    if (g) g.services.push(item);
    else byGroup.set(sv.service_group_id, { meta: sv, services: [item] });
  }

  const groups: TokenGroupSummary[] = [...byGroup.entries()].map(([id, g]) => {
    const services = [...g.services].sort((a, b) => b.avg_total - a.avg_total);
    const avg_input = services.reduce((t, x) => t + x.avg_input, 0);
    const avg_output = services.reduce((t, x) => t + x.avg_output, 0);
    const avg_total = avg_input + avg_output;
    for (const x of services) x.share_pct = avg_total ? round1((x.avg_total / avg_total) * 100) : 0;
    return {
      service_group_id: id,
      service_group_name: g.meta.service_group_name,
      division: g.meta.division ?? '',
      service_count: services.length,
      share_pct: 0, // 전체 합계 이후 채움
      avg_input,
      avg_output,
      avg_total,
      services,
    };
  });
  const grand = groups.reduce((t, g) => t + g.avg_total, 0);
  for (const g of groups) g.share_pct = grand ? round1((g.avg_total / grand) * 100) : 0;

  return {
    totals: {
      group_count: groups.length,
      service_count: groups.reduce((t, g) => t + g.service_count, 0),
      avg_total: grand,
      avg_input: groups.reduce((t, g) => t + g.avg_input, 0),
      avg_output: groups.reduce((t, g) => t + g.avg_output, 0),
      day_count: raw.day_count ?? fallbackDayCount,
    },
    groups,
  };
}

/** 확장 차트 피드: 그룹 상위 5개 서비스의 타임시리즈만, 점유율 순서로. */
export function rollupGroupSeries(
  points: ServiceTimeseriesPoint[],
  view: TokenView,
  groupId: string,
): ServiceTimeseriesPoint[] {
  const g = view.groups.find((x) => x.service_group_id === groupId);
  if (!g) return [];
  const top5 = g.services.slice(0, 5).map((s) => s.service_id);
  const order = new Map(top5.map((id, i) => [id, i]));
  return points
    .filter((p) => order.has(p.service_id))
    .sort((a, b) => order.get(a.service_id)! - order.get(b.service_id)! || a.ts.localeCompare(b.ts));
}
