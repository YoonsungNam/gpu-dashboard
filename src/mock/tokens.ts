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

/* ---- GET /api/token/totals (KPI strip — nodes 7104:3455/3465/3478) ---- */
export const tokenTotals: TokenTotals = {
  group_count: 52,
  service_count: 42112,
  avg_total: 402_000_000, // fmtTokens → '402M'
  day_count: 28, // '최근 28일 기준' in the 서비스 전체 modal (7104:4624)
};

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
function genServices(groupId: string, seed: number, count: number, leadNames: string[]): TokenServiceItem[] {
  const r = rng(seed);
  // Skewed weights so big groups top out around the render's 14%/10%/8.8%…
  const weights = Array.from({ length: count }, () => 0.25 + Math.pow(r(), 4) * 6).sort((a, b) => b - a);
  const sum = weights.reduce((s, w) => s + w, 0);
  return weights.map((w, i) => {
    const input = Math.round((120 + r() * 830) ) * 1_000; // 120K..950K
    const output = Math.round((60 + r() * 540)) * 1_000; // 60K..600K
    return {
      service_id: `${groupId}-S${String(i + 1).padStart(2, '0')}`,
      service_name: leadNames[i] ?? `${pick(r, NAME_HEADS)} ${pick(r, NAME_TAILS)}`,
      model: pick(r, MODELS),
      share_pct: round1((w / sum) * 100),
      avg_input: input,
      avg_output: output,
      avg_total: Math.round((60 + r() * 840)) * 1_000,
    };
  });
}

/**
 * The four groups visible in the renders. avg_input/avg_output are the design
 * strings where given (group #1: 2.9M / 1.7M); for #2/#3 they are chosen so
 * the DERIVED ioRatio() reproduces the design's I:O strings ('5.2:2', '6.2:6').
 */
const LEAD_GROUPS: Array<{
  name: string; division: string; count: number; share: number;
  input: number; output: number; total: number; leads: string[];
}> = [
  {
    name: 'Solution 개발실 특화 AI 에이전트 플랫폼', division: 'DX', count: 3,
    share: 8.3, input: 2_900_000, output: 1_700_000, total: 1_700_000,
    leads: ['Moderation Pro', 'Solution Advanced Agent', 'Moderation Pro'],
  },
  {
    name: 'Contents Moderation SR Platform', division: 'SAIT', count: 35,
    share: 29.2, input: 5_200_000, output: 2_000_000, total: 1_700_000, // I:O → '5.2:2'
    leads: [
      'Voice Clone Stream Development Lite', 'Moderation Pro',
      'Voice Clone Contents Solution', 'Voice Clone Edge Platform', 'Moderation Pro',
    ],
  },
  {
    name: 'DS Health Assistant API', division: 'AI센터', count: 41,
    share: 12.5, input: 6_200_000, output: 6_000_000, total: 1_700_000, // I:O → '6.2:6'
    leads: [
      'Health Assistant Platform', 'Moderation Pro', 'API Solution Development',
      'Development Stream Lite Edge', 'Assistant DS Lite',
    ],
  },
  {
    name: 'Solution 개발실 특화 AI 에이전트 플랫폼', division: 'DX', count: 1,
    share: 8.3, input: 2_900_000, output: 1_700_000, total: 1_700_000,
    leads: ['Moderation Pro'],
  },
];

/** rng-seeded filler groups below the fold (KPI says 52 groups exist). */
const FILLER_GROUPS = [
  { name: 'MX Vision Inspection Platform', division: '메모리' },
  { name: 'Foundry Yield Insight API', division: '글로벌 제조&인프라총괄' },
  { name: 'Global Contents Translation Suite', division: 'S.LSI' },
  { name: 'Voice Clone Studio Platform', division: 'SAIT' },
];

/* ---- GET /api/token/groups ---- */
export const serviceGroups: TokenGroupSummary[] = [
  ...LEAD_GROUPS.map((g, i): TokenGroupSummary => {
    const id = `TG${String(i + 1).padStart(2, '0')}`;
    return {
      service_group_id: id,
      service_group_name: g.name,
      division: g.division,
      service_count: g.count,
      share_pct: g.share,
      avg_input: g.input,
      avg_output: g.output,
      avg_total: g.total,
      services: genServices(id, 2100 + i * 13, g.count, g.leads),
    };
  }),
  ...FILLER_GROUPS.map((g, i): TokenGroupSummary => {
    const id = `TG${String(LEAD_GROUPS.length + i + 1).padStart(2, '0')}`;
    const r = rng(3300 + i * 17);
    const count = 6 + Math.floor(r() * 19);
    return {
      service_group_id: id,
      service_group_name: g.name,
      division: g.division,
      service_count: count,
      share_pct: round1(3 + r() * 12),
      avg_input: Math.round(12 + r() * 58) * 100_000, // 1.2M..7M
      avg_output: Math.round(8 + r() * 42) * 100_000, // 0.8M..5M
      avg_total: Math.round(8 + r() * 26) * 100_000, // 0.8M..3.4M
      services: genServices(id, 4400 + i * 29, count, []),
    };
  }),
];

/**
 * GET /api/token/timeseries — per group: top-5 services × 14 days
 * ('2026-05-18'..'2026-05-31'), total_tokens in 40K..950K so the chart's
 * fixed 0–1M Y axis (ticks 0/250K/500K/750K/1M) frames every line.
 */
export const groupTokenTimeseries: Record<string, ServiceTimeseriesPoint[]> =
  Object.fromEntries(
    serviceGroups.map((g, gi) => [
      g.service_group_id,
      g.services.slice(0, 5).flatMap((svc, si) => {
        const r = rng(9000 + gi * 37 + si * 7);
        const base = 150_000 + r() * 650_000;
        return Array.from({ length: 14 }, (_, d) => ({
          service_id: svc.service_id,
          service_name: svc.service_name,
          ts: `2026-05-${18 + d}`,
          total_tokens: Math.round(
            clamp(base + (r() - 0.5) * 280_000 + Math.sin((d + si * 2) / 2.2) * 110_000, 40_000, 950_000),
          ),
        }));
      }),
    ]),
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
