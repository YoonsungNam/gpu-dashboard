import { color, radius, text } from '../../tokens';

/**
 * Segmented-control tabs (Figma resource toolbar, node 7001:50021).
 * Connected pill buttons: active = #E6F1FA fill + #0077C8 text, inactive = white + #3C444B text,
 * both bordered #CCD1D6.
 */
export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div role="tablist" style={{ display: 'inline-flex' }}>
      {tabs.map((tab, i) => {
        const isActive = tab.key === active;
        const first = i === 0;
        const last = i === tabs.length - 1;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              ...text.bodyM,
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              height: 28,
              padding: '0 12px',
              whiteSpace: 'nowrap',
              background: isActive ? '#E6F1FA' : color.cardBg,
              color: isActive ? '#0077C8' : '#3C444B',
              border: `1px solid ${color.borderStrong}`,
              // collapse the shared edge so the group reads as one segmented control
              borderLeft: first ? `1px solid ${color.borderStrong}` : 'none',
              borderTopLeftRadius: first ? radius.cell : 0,
              borderBottomLeftRadius: first ? radius.cell : 0,
              borderTopRightRadius: last ? radius.cell : 0,
              borderBottomRightRadius: last ? radius.cell : 0,
            }}
          >
            {tab.count != null ? `${tab.label} (${tab.count})` : tab.label}
          </button>
        );
      })}
    </div>
  );
}
