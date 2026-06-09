import { color, space, text } from '../../tokens';

/** Horizontal tab row. Active tab uses brand text + 2px brand bottom border. */
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
    <div
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: `1px solid ${color.border}`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              ...text.bodyM,
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: `${space.md}px ${space.lg}px`,
              color: isActive ? color.brand : color.textTertiary,
              borderBottom: `2px solid ${isActive ? color.brand : 'transparent'}`,
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.count != null ? `${tab.label} (${tab.count})` : tab.label}
          </button>
        );
      })}
    </div>
  );
}
