import { color, radius, space, text } from '../../tokens';

interface FilterItem {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

/** Single labeled native select. Internal to FilterBar (no separate file). */
function Select({ label, options, value, onChange }: FilterItem) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: space.xxs,
      }}
    >
      <span style={{ ...text.label, color: color.textSecondary }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: `1px solid ${color.border}`,
          borderRadius: radius.sm,
          padding: '4px 8px',
          background: color.cardBg,
          color: color.textPrimary,
          ...text.label,
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Horizontal row of labeled dropdown selects for the top bar. */
export default function FilterBar({ filters }: { filters: FilterItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space.md,
      }}
    >
      {filters.map((f) => (
        <Select key={f.label} {...f} />
      ))}
    </div>
  );
}
