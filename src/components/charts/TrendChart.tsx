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
} as const;

/** 'YYYY-MM-DD' → '5/18' — 일별 x축 라벨 (2026-06-11 피드백: 일 단위 표기). */
const fmtDay = (v: string | number) => {
  const s = String(v);
  const m = s.slice(5, 7);
  const d = s.slice(8, 10);
  return m && d ? `${+m}/${+d}` : s;
};

/**
 * v2 dark tooltip content (node I7104:14218): rgba(40,48,55,0.9) r6 panel,
 * 8/16 padding, 400/12 #FAFBFC text; un-bulleted date label above bulleted
 * '• {name}: {value}' rows, with Slot Util listed ABOVE GPU Util (reverse of
 * the series declaration order — line z-order stays as declared).
 */
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string | number; value?: string | number }[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: 'rgba(40,48,55,0.9)',
        borderRadius: 6,
        padding: '8px 16px',
        ...text.caption,
        color: '#FAFBFC',
      }}
    >
      <div>{typeof label === 'string' ? label.slice(5) : String(label ?? '')}</div>
      {[...payload].reverse().map((item) => (
        <div key={String(item.name)}>
          {`• ${item.name}: ${
            typeof item.value === 'number' ? item.value.toFixed(1) : item.value
          }`}
        </div>
      ))}
    </div>
  );
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
  // 일별 라벨을 전부 표시 — 14일 초과 창에서는 라벨을 기울여 겹침을 피한다.
  const angled = data.length > 14;

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
          tick={{ ...tickStyle, fontSize: angled ? 9 : 10, fill: color.textTertiary }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={angled ? -45 : 0}
          textAnchor={angled ? 'end' : 'middle'}
          height={angled ? 28 : 22}
          padding={{ left: 8, right: 8 }}
          tickFormatter={fmtDay}
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
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: color.borderStrong }} />

        {series.map((s) =>
          area ? (
            <Area isAnimationActive={false}
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash ? '5 4' : undefined}
              fill={`url(#trend-grad-${s.key})`}
              dot={{ r: 2, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 3 }}
            />
          ) : (
            <Line isAnimationActive={false}
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash ? '5 4' : undefined}
              // 일별 Data Point 도트 (2026-06-11 피드백 — 기존 '도트 제거'를 대체).
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              // v2 hover: dashed Slot line fills solid in the darkened hue; the solid
              // GPU line keeps a hollow white dot with a 2px ring (Ellipse 14, 7104:14216).
              activeDot={
                s.dash
                  ? { r: 5, strokeWidth: 0, fill: s.activeColor ?? s.color }
                  : { r: 5, fill: color.white, stroke: s.activeColor ?? s.color, strokeWidth: 2 }
              }
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
