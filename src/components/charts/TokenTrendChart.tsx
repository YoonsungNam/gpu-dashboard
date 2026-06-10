import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { color, font, shadow, text, tokenScreen } from '../../tokens';
import { fmtTokens } from '../../lib/util';

export interface TokenTrendChartProps {
  /** Pivoted rows: { ts: '05-18', [service_id]: total_tokens } (pivotTokenSeries). */
  rows: Record<string, number | string>[];
  /** Top-5 services of the group, in legend/line order. */
  series: { service_id: string; service_name: string }[];
  title?: string;
}

const TICK = { fontSize: 12, fill: color.textSecondary, fontFamily: font.family } as const;

/**
 * Expanded-group chart panel (node 'Chart' 7104:3941, 1640x390): #F3F8FD band
 * with padding 20/88 around a white r4 inner card (1464x350) holding the
 * '그룹 내 상위 5개 서비스 · 일별 토큰 추이' header, ring-dot legend and a
 * 14-day recharts LineChart (solid horizontal #E4E9ED grid, 0–1M Y axis,
 * hollow 8px dots on every point, series colors tokenScreen.series).
 */
export default function TokenTrendChart({
  rows,
  series,
  // Double space after '내' matches TEXT node 7104:4069 exactly.
  title = '그룹 내  상위 5개 서비스 · 일별 토큰 추이',
}: TokenTrendChartProps) {
  const lines = series.slice(0, 5);
  return (
    <div
      style={{
        background: tokenScreen.selected.rowBg, // #F3F8FD
        height: 390,
        // 19px bottom pad + 1px border keeps the band at exactly 390 (border-box).
        padding: '20px 88px 19px',
        borderBottom: '1px solid #ECF1F5', // band bottom separator (7104:3960)
      }}
    >
      <div
        style={{
          height: 350,
          background: color.white,
          borderRadius: 4,
          border: '1px solid #ECF1F5', // inner card outline (Rectangle 3473606)
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header: title left (500/14 #767D84), ring-dot legend right (7104:3944). */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '20px 20px 8px',
          }}
        >
          <span style={{ ...text.bodyM, color: color.textTertiary }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {lines.map((s, i) => (
              <span key={s.service_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color.white,
                    border: `2px solid ${tokenScreen.series[i]}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ ...text.label, color: color.textTertiary, whiteSpace: 'nowrap' }}>
                  {s.service_name}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 24px 14px', minHeight: 0 }}>
          <ResponsiveContainer width="100%" height={275}>
            <LineChart data={rows} margin={{ top: 6, right: 16, bottom: 0, left: 0 }}>
              {/* Solid horizontal-only gridlines (ChartLine 7104:3984-3988). */}
              <CartesianGrid stroke={tokenScreen.bar.track} vertical={false} />

              <XAxis
                dataKey="ts"
                tick={TICK}
                tickLine={false}
                axisLine={false}
                interval={0}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={[0, 1_000_000]}
                ticks={[0, 250_000, 500_000, 750_000, 1_000_000]}
                tickFormatter={(v: number) => fmtTokens(v)}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              {/* White tooltip card per the build spec (#E4E9ED border, caption text). */}
              <Tooltip
                contentStyle={{
                  background: color.white,
                  border: `1px solid ${color.border}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  boxShadow: shadow.card,
                  ...text.caption,
                  color: color.textSecondary,
                }}
                labelStyle={{ ...text.caption, color: color.textTertiary, marginBottom: 4 }}
                itemStyle={{ ...text.caption, padding: 0 }}
                formatter={(v) => fmtTokens(Number(v))}
                cursor={{ stroke: color.borderStrong }}
              />

              {lines.map((s, i) => (
                <Line
                  key={s.service_id}
                  type="linear"
                  dataKey={s.service_id}
                  name={s.service_name}
                  stroke={tokenScreen.series[i]}
                  strokeWidth={2}
                  // No mount animation — series must paint on first frame.
                  isAnimationActive={false}
                  // Hollow 8px markers on EVERY point (Ellipse 27-40 per series).
                  dot={{ r: 4, fill: color.white, stroke: tokenScreen.series[i], strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
