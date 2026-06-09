/**
 * Design tokens — extracted directly from Figma "[공유용]GPU Dashboard"
 * (file 9NJCWQplwN2chEpFrCKILG, lastModified 2026-06-08).
 *
 * These are the source of truth for styling. The internal app uses inline CSS,
 * so every token here is a plain JS value meant to be spread/used inside
 * `style={{ ... }}`. No build step, no CSS framework required.
 *
 * Raw evidence: design/figma-extract.json
 */

/* ------------------------------------------------------------------ */
/* Color                                                               */
/* ------------------------------------------------------------------ */
export const color = {
  // Surfaces
  pageBg: '#F2F6F9', // app content background (cool light gray)
  cardBg: '#FFFFFF',
  cardBgAlt: '#F6F8FA', // subtle panels / table sub-rows
  rowHover: '#FAFBFC',

  // Sidebar (dark navy)
  sidebarBg: '#002035',
  sidebarItemActive: '#0064A7',
  sidebarText: '#B9BBBE',
  sidebarTextActive: '#FFFFFF',

  // Borders / dividers
  border: '#E4E9ED',
  borderStrong: '#CCD1D6',
  borderSubtle: '#DADFE4',

  // Text
  textPrimary: '#2F363C',
  textSecondary: '#565E66',
  textTertiary: '#767D84',
  textMuted: '#90969D',
  textDisabled: '#B2B6BB',

  // Brand / accent blues
  brand: '#0077C8',
  brandStrong: '#0064A7',
  brandLight: '#3392D3',
  accentCyan: '#00B3E2',

  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Semantic colors driven by GPU UTIL / SLOT UTIL thresholds and task type.
 * Source: Figma "Badge Color" guide (node 7001:51337).
 */
export const semantic = {
  // Utilization threshold pills (e.g. 90.0% green, 78.7% amber, 12.4% red)
  util: {
    good: { bg: '#D4F1D7', border: '#AAE4B0', text: '#0D3D13' },
    warn: { bg: '#FFE1B5', border: '#FFD390', text: '#6B4915' },
    bad: { bg: '#FFD9D7', border: '#FFC7C3', text: '#A52921' },
  },
  // Task-type badges
  taskType: {
    inference: { bg: '#CCF0F9', text: '#007492' }, // 추론
    training: { bg: '#E0D9FF', text: '#5A49A6' }, // 학습
    core: { bg: '#ECF1F5', text: '#565E66' }, // 핵심
  },
  // Trend deltas
  delta: { up: '#239B2F', down: '#FF4337' },
} as const;

/** Categorical palette for GPU-model stacked bars and multi-series charts. */
export const chart = {
  categorical: [
    '#00B3E2', '#00C3B1', '#008074', '#66D1EE', '#96D552',
    '#55C961', '#6978B8', '#5A49A6', '#3A4571', '#3392D3',
  ],
  // Tentative — confirm against the two-line 사용추이 chart during build.
  series: { primary: '#00B3E2', secondary: '#5A49A6' },
  grid: '#E4E9ED',
  axis: '#90969D',
} as const;

/* ------------------------------------------------------------------ */
/* Typography — primary face is Pretendard GOV                         */
/* ------------------------------------------------------------------ */
export const font = {
  family:
    "'Pretendard GOV', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  brand: "'Samsung Sharp Sans', 'Pretendard GOV', sans-serif", // logo only
  mono: "'Inter', monospace", // chart axis ticks
} as const;

type TextStyle = {
  fontSize: number;
  lineHeight: string;
  fontWeight: number;
  fontFamily?: string;
};

/** Named type ramp (size / lineHeight / weight straight from Figma). */
export const text: Record<string, TextStyle> = {
  sectionTitle: { fontSize: 20, lineHeight: '24px', fontWeight: 600 }, // "GPU 활용현황"
  cardTitle: { fontSize: 16, lineHeight: '20px', fontWeight: 600 }, // "Inference / 추론"
  metricXl: { fontSize: 28, lineHeight: '36px', fontWeight: 600 }, // 521 / 852
  metricTotal: { fontSize: 26, lineHeight: '28px', fontWeight: 600 }, // 2,941
  metricLg: { fontSize: 24, lineHeight: '28px', fontWeight: 600 }, // expanded-row stats
  bodyM: { fontSize: 14, lineHeight: '20px', fontWeight: 500 },
  body: { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
  label: { fontSize: 12, lineHeight: '14px', fontWeight: 500 }, // "Projects", chips
  caption: { fontSize: 12, lineHeight: '14px', fontWeight: 400 },
  tiny: { fontSize: 11, lineHeight: '12px', fontWeight: 400 },
  numTiny: { fontSize: 11, lineHeight: '13px', fontWeight: 700 }, // dense count cells
  axis: { fontSize: 10, lineHeight: '12px', fontWeight: 400, fontFamily: font.mono },
};

/* ------------------------------------------------------------------ */
/* Spacing / radius / elevation                                        */
/* ------------------------------------------------------------------ */
// Dominant auto-layout gaps in the design: 4, 6, 8, 12, 16 (base ~4).
export const space = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
} as const;

export const radius = {
  cell: 2, // table cells / small chips (most common)
  sm: 4,
  card: 8, // cards & panels
  lg: 10,
  xl: 20,
  pill: 100, // fully rounded badges
} as const;

export const shadow = {
  // Subtle two-layer card elevation from Figma (#283037 @ 12%).
  card: '0 1px 2px rgba(40,48,55,0.12), 0 0 2px rgba(40,48,55,0.12)',
} as const;

export const layout = {
  sidebarWidth: 160,
  topbarHeight: 48,
  contentMaxWidth: 1440,
  pagePadding: 16,
} as const;

export const tokens = {
  color, semantic, chart, font, text, space, radius, shadow, layout,
};
export default tokens;
