import { radius, text } from '../../tokens';
import type { ProjectGrade } from '../../mock/types';

/**
 * 워크그룹 등급 칩 (GPU 활용 현황 행 + 펼침/선택 행 제목). 18px high, r2, 400/12.
 * Colors from the Badge Color guide (2026-06-17, node 7221:6328):
 * 우수 #EAF8EB/#145C1C · 저활용 #FFF0EF/#D2362C · 수집 대기 #E9EEF2/#3C444B.
 *
 * '수집 대기'는 등급 규칙(GRADE_POLICY) 산출값이 아니라 데이터 미수집 상태를
 * 가리키는 표시 전용 값 — ProjectGrade(우수/저활용)·등급 필터는 그대로 두고
 * 디자인 시스템에서 배지만 지원한다 (트리거 연결은 보류).
 */
export type GradeBadgeValue = ProjectGrade | '수집 대기';

const STYLES: Record<GradeBadgeValue, { bg: string; text: string; border?: string }> = {
  '우수': { bg: '#EAF8EB', text: '#145C1C' },
  '저활용': { bg: '#FFF0EF', text: '#D2362C' },
  '수집 대기': { bg: '#E9EEF2', text: '#3C444B' },
};

export default function GradeBadge({ grade }: { grade?: GradeBadgeValue | null }) {
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
