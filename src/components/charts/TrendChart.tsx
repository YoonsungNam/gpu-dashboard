import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chart, color, font, text } from '../../tokens';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  /** Render this series as a dashed line (e.g. Slot Util in the Figma design). */
  dash?: boolean;
  /** Darker hover-dot fill (v2: inference #0093BA, training #6978B8). */
  activeColor?: string;
}

export interface TrendChartProps {
  data: Record<string, number | string>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  /** When true (default), render filled gradient areas; otherwise plain v2 lines. */
  area?: boolean;
}

const tickStyle = {
  fontSize: 10,
  fontFamily: font.mono,
} as const;

/** Index step so ~7 markers/labels land on evenly spaced dates (first + every Nth + last). */
const markerStep = (n: number) => Math.max(1, Math.round((n - 1) / 6));

/** True for the indices that carry an axis label and a series marker. */
const isMarkerIndex = (i: number, n: number, step: number) => i % step === 0 || i === n - 1;

/**
 * Per-series tick-date markers (v2 trend spec): 10px dia dots only at the
 * labeled dates — hollow (white fill, 2px series stroke) on the solid GPU Util
 * line, filled in series color on the dashed Slot Util line.
 */
function seriesDot(s: TrendSeries, n: number) {
  const step = markerStep(n);
  return (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    const key = `${s.key}-dot-${index}`;
    if (index == null || cx == null || cy == null || !isMarkerIndex(index, n, step)) {
      return <g key={key} />;
    }
    return s.dash ? (
      <circle key={key} cx={cx} cy={cy} r={5} fill={s.color} />
    ) : (
      <circle key={key} cx={cx} cy={cy} r={5} fill={color.white} stroke={s.color} strokeWidth={2} />
    );
  };
}

/** Multi-series line/area chart for 사용추이 (usage trend). Legend rendered externally. */
export default function TrendChart({
  data,
  xKey,
  series,
  height = 238,
  area = true,
}: TrendChartProps) {
  const Chart = area ? AreaChart : LineChart;
  const n = data.length;
  const step = markerStep(n);
  // Explicit ticks so the line markers land exactly on the labeled dates.
  const xTicks = data
    .filter((_, i) => isMarkerIndex(i, n, step))
    .map((d) => d[xKey]) as (string | number)[];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        {area && (
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`trend-grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
        )}

        {/* v2: solid light horizontal gridlines on the fixed 0–100 ticks */}
        <CartesianGrid stroke={chart.grid} vertical={false} />

        <XAxis
          dataKey={xKey}
          tick={{ ...tickStyle, fill: color.textTertiary }}
          tickLine={false}
          axisLine={false}
          ticks={xTicks}
          interval={0}
          padding={{ left: 8, right: 8 }}
          tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : String(v))}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ ...tickStyle, fill: chart.axis }}
          tickLine={false}
          axisLine={false}
          width={32}
        />

        {/* v2 dark tooltip: #283037 @ 90%, r6, 8/16 padding, #FAFBFC 400/12 text */}
        <Tooltip
          contentStyle={{
            background: 'rgba(40,48,55,0.9)',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            boxShadow: 'none',
            ...text.caption,
            color: '#FAFBFC',
          }}
          labelStyle={{ ...text.caption, color: '#FAFBFC' }}
          itemStyle={{ ...text.caption, color: '#FAFBFC', padding: 0 }}
          labelFormatter={(v) => (typeof v === 'string' ? v.slice(5) : String(v))}
          cursor={{ stroke: color.borderStrong }}
        />

        {series.map((s) =>
          area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash ? '5 4' : undefined}
              fill={`url(#trend-grad-${s.key})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash ? '5 4' : undefined}
              dot={seriesDot(s, n)}
              activeDot={{ r: 5, strokeWidth: 0, fill: s.activeColor ?? s.color }}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
