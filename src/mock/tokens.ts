/**
 * 토큰 활용 현황 mock data — GET /api/token/* shapes (see types.ts).
 * The four lead groups carry the exact values shown in the Figma renders
 * (GPU_Token_collapse/expand, frames 7104:2731/3479); the rest is rng filler.
 * Deterministic (same mulberry32 rng as mock/data.ts) so screens look stable.
 */
import type {
  ServiceTimeseriesPoint,
  TokenGroupSummary,
  TokenServiceItem,
  TokenTotals,
} from './types';
import { DATES, DAYS, DEFAULT_FILTERS, PERIOD_DAYS, type GlobalFilters } from './data';

/* ---- tiny deterministic RNG (mulberry32 — copied from mock/data.ts) ---- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));



/** Serving-model sub-labels from the modal rows (7104:4377/4400). */
const MODELS = ['GPT-OSS', 'Qwne-32B', 'Gemini-9BB'];

/** Word pools for rng-composed service names (design-style English labels). */
const NAME_HEADS = [
  'Moderation', 'Voice Clone', 'Solution', 'Health Assistant',
  'Contents', 'API', 'Development', 'Stream',
];
const NAME_TAILS = [
  'Pro', 'Batch', 'GateWay Platform', 'Stream Lite', 'Edge Platform',
  'Advanced Agent', 'DS Lite', 'Solution',
];

/**
 * Per-group child services: lead names come straight from the renders, the
 * rest are composed from the pools. share_pct sums to ~100 within the group
 * and is sorted desc (UI shows the first 3–5, rest behind 더보기).
 */
/** Per-service DAILY input/output — the token fact table (28 days). */
export const serviceDaily: Record<string, { input: number[]; output: number[] }> = {};

function genServices(groupId: string, seed: number, count: number, leadNames: string[]): TokenServiceItem[] {
  const r = rng(seed);
  // 그룹 내 서비스명 중복 방지 — 같은 이름이 두 번 나오면 범례가 모호해진다.
  const used = new Map<string, number>();
  const uniqueName = (raw: string) => {
    const n = used.get(raw) ?? 0;
    used.set(raw, n + 1);
    return n === 0 ? raw : `${raw} ${n + 1}`;
  };
  const items = Array.from({ length: count }, (_, i) => {
    // 일평균 합계가 B 단위에 들어오는 스케일: 서비스당 입력 10-50M · 출력 6-36M/일
    // → 46개 서비스 합계 ≈ 2.3B/일 (2026-06-11 피드백).
    const baseIn = (10 + r() * 40) * 1_000_000;
    const baseOut = (6 + r() * 30) * 1_000_000;
    const id = `${groupId}-S${String(i + 1).padStart(2, '0')}`;
    serviceDaily[id] = {
      input: Array.from({ length: DAYS }, (_, d) =>
        Math.round(clamp(baseIn * (1 + (r() - 0.5) * 0.5 + Math.sin((d + i) / 3) * 0.18), 3_000_000, 60_000_000)),
      ),
      output: Array.from({ length: DAYS }, (_, d) =>
        Math.round(clamp(baseOut * (1 + (r() - 0.5) * 0.5 + Math.cos((d + i) / 3.4) * 0.18), 2_000_000, 45_000_000)),
      ),
    };
    return {
      service_id: id,
      service_name: uniqueName(leadNames[i] ?? `${pick(r, NAME_HEADS)} ${pick(r, NAME_TAILS)}`),
      model: pick(r, MODELS),
      share_pct: 0, // filled per-view from the window means
      avg_input: 0,
      avg_output: 0,
      avg_total: 0,
    };
  });
  return items;
}

/**
 * The four groups visible in the renders, resized per 2026-06-11 운영 피드백:
 * 전체 13개 그룹 × 46개 서비스 (lead 4그룹 21개 + filler 9그룹 25개).
 */
const LEAD_GROUPS: Array<{ name: string; division: string; count: number; leads: string[]; critical?: boolean }> = [
  {
    name: 'Solution 개발실 특화 AI 에이전트 플랫폼', division: 'DX', count: 3,
    leads: ['Moderation Pro', 'Solution Advanced Agent', 'Moderation Pro'],
  },
  {
    name: 'Contents Moderation SR Platform', division: 'SAIT', count: 8, critical: true,
    leads: [
      'Voice Clone Stream Development Lite', 'Moderation Pro',
      'Voice Clone Contents Solution', 'Voice Clone Edge Platform', 'Moderation Pro',
    ],
  },
  {
    name: 'DS Health Assistant API', division: 'AI센터', count: 9, critical: true,
    leads: [
      'Health Assistant Platform', 'Moderation Pro', 'API Solution Development',
      'Development Stream Lite Edge', 'Assistant DS Lite',
    ],
  },
  {
    name: 'Solution 개발실 특화 AI 에이전트 플랫폼', division: 'DX', count: 1,
    leads: ['Moderation Pro'],
  },
];

/** Filler groups below the fold — counts are explicit so Σ서비스 = 46 정확히. */
const FILLER_GROUPS: Array<{ name: string; division: string; count: number }> = [
  { name: 'MX Vision Inspection Platform', division: '메모리', count: 2 },
  { name: 'Foundry Yield Insight API', division: '글로벌 제조&인프라총괄', count: 3 },
  { name: 'Global Contents Translation Suite', division: 'S.LSI', count: 4 },
  { name: 'Voice Clone Studio Platform', division: 'SAIT', count: 2 },
  { name: 'Memory Defect Review Assistant', division: '메모리', count: 3 },
  { name: 'EUV Process Copilot', division: 'S.LSI', count: 4 },
  { name: 'DX Sales Insight Chat', division: 'DX', count: 2 },
  { name: 'Infra Ops Agent Platform', division: '글로벌 제조&인프라총괄', count: 3 },
  { name: 'SAIT Research Paper Search', division: 'SAIT', count: 2 },
];

/* ---- Group skeletons (identity + children; values come from the view) ---- */
interface GroupSkeleton {
  service_group_id: string;
  service_group_name: string;
  division: string;
  is_critical: 'Y' | 'N';
  services: TokenServiceItem[];
}

const groupSkeletons: GroupSkeleton[] = [
  ...LEAD_GROUPS.map((g, i) => {
    const id = `TG${String(i + 1).padStart(2, '0')}`;
    return {
      service_group_id: id,
      service_group_name: g.name,
      division: g.division,
      is_critical: (g.critical ? 'Y' : 'N') as 'Y' | 'N',
      services: genServices(id, 2100 + i * 13, g.count, g.leads),
    };
  }),
  ...FILLER_GROUPS.map((g, i) => {
    const id = `TG${String(LEAD_GROUPS.length + i + 1).padStart(2, '0')}`;
    const r = rng(3300 + i * 17);
    return {
      service_group_id: id,
      service_group_name: g.name,
      division: g.division,
      is_critical: (r() > 0.6 ? 'Y' : 'N') as 'Y' | 'N',
      services: genServices(id, 4400 + i * 29, g.count, []),
    };
  }),
];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const winMean = (xs: number[], n: number) => Math.round(mean(xs.slice(Math.max(0, xs.length - n))));

/* ---- GET /api/token/view?filters=… ----
   EVERYTHING the screen shows derives from the daily fact table over the
   active 기간 window, filtered by 사업부 / 과제 구분 — so the KPI strip, the
   group rows, the child rows, the 더보기/modal lists and the chart always
   reconcile, under any header-filter combination. */
export interface TokenView {
  totals: TokenTotals;
  groups: TokenGroupSummary[];
}

export function getTokenView(f: GlobalFilters): TokenView {
  const n = PERIOD_DAYS[f.period];
  const skeletons = groupSkeletons.filter(
    (g) =>
      (f.division === '전체' || g.division === f.division) &&
      (f.taskClass === '전체' || (g.is_critical === 'Y' ? '전략' : '일반') === f.taskClass),
  );
  const groups: TokenGroupSummary[] = skeletons.map((g) => {
    const services = g.services
      .map((sv) => {
        const d = serviceDaily[sv.service_id];
        const avg_input = winMean(d.input, n);
        const avg_output = winMean(d.output, n);
        return { ...sv, avg_input, avg_output, avg_total: avg_input + avg_output };
      })
      .sort((a, b) => b.avg_total - a.avg_total);
    const avg_input = services.reduce((t, x) => t + x.avg_input, 0);
    const avg_output = services.reduce((t, x) => t + x.avg_output, 0);
    const avg_total = avg_input + avg_output;
    for (const x of services) x.share_pct = round1((x.avg_total / avg_total) * 100);
    return {
      service_group_id: g.service_group_id,
      service_group_name: g.service_group_name,
      division: g.division,
      service_count: services.length,
      share_pct: 0, // filled below
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
      day_count: PERIOD_DAYS[f.period],
    },
    groups,
  };
}

/** Legacy default-filter views. */
export const serviceGroups: TokenGroupSummary[] = getTokenView(DEFAULT_FILTERS).groups;
export const tokenTotals: TokenTotals = getTokenView(DEFAULT_FILTERS).totals;

/* ---- Per-group chart feed: top-5 services' DAILY totals over the window ---- */
export function getGroupSeries(groupId: string, f: GlobalFilters): ServiceTimeseriesPoint[] {
  const n = PERIOD_DAYS[f.period];
  const view = getTokenView(f);
  const g = view.groups.find((x) => x.service_group_id === groupId);
  if (!g) return [];
  const dayIdx = Array.from({ length: DAYS }, (_, d) => d).slice(DAYS - n);
  return g.services.slice(0, 5).flatMap((sv) =>
    dayIdx.map((d) => ({
      service_id: sv.service_id,
      service_name: sv.service_name,
      ts: DATES[d],
      total_tokens: serviceDaily[sv.service_id].input[d] + serviceDaily[sv.service_id].output[d],
    })),
  );
}

/** Legacy: default-filter per-group series map. */
export const groupTokenTimeseries: Record<string, ServiceTimeseriesPoint[]> = Object.fromEntries(
  serviceGroups.map((g) => [g.service_group_id, getGroupSeries(g.service_group_id, DEFAULT_FILTERS)]),
);

/** Chart feed for TokenTrendChart, built from pivotTokenSeries(). */
export interface TokenChartFeed {
  /** One row per day: { ts: '05-18', [service_id]: total_tokens } */
  rows: Record<string, number | string>[];
  /** Top-5 services in first-seen (= share desc) order — legend/line order. */
  series: { service_id: string; service_name: string }[];
}

/** Pivot a per-group timeseries into recharts rows (x = 'MM-DD'). */
export function pivotTokenSeries(points: ServiceTimeseriesPoint[]): TokenChartFeed {
  const series: TokenChartFeed['series'] = [];
  const byTs = new Map<string, Record<string, number | string>>();
  for (const p of points) {
    if (!series.some((s) => s.service_id === p.service_id)) {
      series.push({ service_id: p.service_id, service_name: p.service_name });
    }
    const ts = p.ts.slice(5); // 'YYYY-MM-DD' → 'MM-DD' axis label
    let row = byTs.get(ts);
    if (!row) {
      row = { ts };
      byTs.set(ts, row);
    }
    row[p.service_id] = p.total_tokens;
  }
  return { rows: [...byTs.values()], series };
}
