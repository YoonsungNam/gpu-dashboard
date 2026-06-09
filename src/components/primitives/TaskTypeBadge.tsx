import { radius, semantic, text } from '../../tokens';

type Kind = 'inference' | 'training' | 'core';

const LABEL: Record<Kind, string> = { inference: '추론', training: '학습', core: '핵심' };

/** Maps the Korean task label (or is_critical) to a colored badge. */
export function kindOf(task: string): Kind {
  if (task === '학습') return 'training';
  if (task === '핵심') return 'core';
  return 'inference';
}

export default function TaskTypeBadge({
  kind,
  label,
}: {
  kind: Kind;
  label?: string;
}) {
  const c = semantic.taskType[kind];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: radius.pill,
        background: c.bg,
        color: c.text,
        ...text.label,
        fontWeight: 600,
      }}
    >
      {label ?? LABEL[kind]}
    </span>
  );
}
