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
import { chart, color, font, radius, shadow, text } from '../../tokens';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  /** Render this series as a dashed line (e.g. Slot Util in the Figma design). */
  dash?: boolean;
}

export interface TrendChartProps {
  data: Record<string, number | string>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  /** When true (default), render filled gradient areas; otherwise plain lines. */
  area?: boolean;
}

const tickStyle = {
  fontSize: 10,
  fill: chart.axis,
  fontFamily: font.mono,
} as const;

/** Multi-series line/area chart for 사용추이 (usage trend). Legend rendered externally. */
export default function TrendChart({
  data,
  xKey,
  series,
  height = 180,
  area = true,
}: TrendChartProps) {
  const Chart = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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

        <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey={xKey}
          tick={tickStyle}
          tickLine={{ stroke: chart.grid }}
          axisLine={{ stroke: chart.grid }}
          interval="preserveStartEnd"
          minTickGap={28}
          tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : String(v))}
        />
        <YAxis
          tick={tickStyle}
          tickLine={{ stroke: chart.grid }}
          axisLine={{ stroke: chart.grid }}
          width={32}
        />

        <Tooltip
          contentStyle={{
            background: color.cardBg,
            border: `1px solid ${color.border}`,
            borderRadius: radius.sm,
            boxShadow: shadow.card,
            ...text.caption,
            color: color.textPrimary,
          }}
          labelStyle={{ color: color.textSecondary, ...text.tiny }}
          itemStyle={{ ...text.caption }}
          cursor={{ stroke: chart.grid }}
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
              dot={false}
              activeDot={{ r: 3 }}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
