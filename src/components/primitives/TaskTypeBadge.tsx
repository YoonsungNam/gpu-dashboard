import { radius, semantic, text } from '../../tokens';

type Kind = 'inference' | 'training' | 'core';

// v2: the neutral pill reads '전략' (strategy), not '핵심'.
const LABEL: Record<Kind, string> = { inference: '추론', training: '학습', core: '전략' };

/** Maps the Korean task label (or strategy flag) to a colored badge. */
export function kindOf(task: string): Kind {
  if (task === '학습') return 'training';
  if (task === '핵심' || task === '전략') return 'core';
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
        padding: '3px 6px',
        borderRadius: radius.pill,
        background: c.bg,
        color: c.text,
        ...text.caption,
      }}
    >
      {label ?? LABEL[kind]}
    </span>
  );
}
