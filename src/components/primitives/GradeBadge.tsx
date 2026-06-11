import { radius, text } from '../../tokens';
import type { ProjectGrade } from '../../mock/types';

/**
 * v2 utilization-grade chip rendered after the 워크그룹 name (GPU 활용 현황
 * rows and the expanded/selected row title). 18px high, r2, 400/12 (nodes
 * 7104:8607-8608 '우수' 36×18 #EAF8EB/#145C1C; sampled 저활용 #FFF0EF,
 * text #D2362C).
 */
const STYLES: Record<ProjectGrade, { bg: string; text: string; border?: string }> = {
  '우수': { bg: '#EAF8EB', text: '#145C1C' },
  '저활용': { bg: '#FFF0EF', text: '#D2362C' },
};

export default function GradeBadge({ grade }: { grade?: ProjectGrade | null }) {
  if (!grade) return null;
  const s = STYLES[grade];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 18,
        boxSizing: 'border-box',
        padding: '0 7px',
        borderRadius: radius.cell,
        background: s.bg,
        border: s.border ? `1px solid ${s.border}` : undefined,
        color: s.text,
        ...text.caption,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {grade}
    </span>
  );
}
