import { color, text } from '../../tokens';
import { ServiceGroupIcon, ServiceIcon, TokenSumIcon } from '../../icons/FigureIcons';
import { fmtTokens } from '../../lib/util';
import type { TokenTotals } from '../../mock/types';

/**
 * 토큰 활용 현황 KPI strip (node 'ServiceCount' 7104:3444, 526x28):
 * 서비스 그룹 52 · 서비스 42112 · 일평균 토큰 합계 402M.
 * Each item = 20px glyph + 6px gap + label (400/14 #3C444B) + 10px gap +
 * value (600/24/28 #3C444B); items separated by 1x12 #2F363C sticks
 * (Icon/Icon12-Divider 7104:3456/3466, 31px total width).
 */
export default function ServiceCountKpis({ totals }: { totals: TokenTotals }) {
  const items = [
    { icon: <ServiceGroupIcon />, label: '서비스 그룹', value: String(totals.group_count) },
    // Design renders 42112 without a thousands comma (node 7104:3465).
    { icon: <ServiceIcon />, label: '서비스', value: String(totals.service_count) },
    { icon: <TokenSumIcon />, label: '일평균 토큰 합계', value: fmtTokens(totals.avg_total) },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {items.map((it, i) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && (
            <span
              aria-hidden
              // 1x12 stick centered in the 31px-wide divider frame.
              style={{ width: 1, height: 12, background: color.textPrimary, margin: '0 15px' }}
            />
          )}
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>{it.icon}</span>
          <span style={{ ...text.body, lineHeight: '22px', color: color.textTitle, marginLeft: 6 }}>
            {it.label}
          </span>
          <span style={{ ...text.metricLg, color: color.textTitle, marginLeft: 10 }}>
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
