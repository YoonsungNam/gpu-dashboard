import { useEffect, type CSSProperties } from 'react';
import { color, radius, semantic, shadow, text, tokenScreen } from '../../tokens';
import { GRADE_POLICY, goodLabel, policyBands, purposeDisplay, ruleLabel } from '../../lib/gradePolicy';
import GradeBadge from '../primitives/GradeBadge';

/**
 * '지표 정의' modal — opened from the app-bar ⓘ 지표 정의 button.
 * No Figma spec; follows the kit modal pattern (ServiceListModal):
 * rgba(0,32,53,0.4) overlay, white r8 panel, 52px header + X,
 * Esc / overlay click close. Threshold chips reuse the semantic.util
 * pill colors so the legend matches the table badges 1:1.
 */

// 2026-06-11 디자인 '모니터링 지표 정의' (node 7164:7033-7044) 문안
const DEFS: { name: string; def: string }[] = [
  { name: 'GPU Util', def: '점유된 GPU 시간 중 실제 GPU가 activate된 시간의 비율' },
  { name: 'GPU Util WH', def: '근무시간 (Working Hours, 09:00~18:00) 중 실제 GPU가 activate된 시간의 비율' },
  { name: 'GPU Util AH', def: '비근무시간 (After Hours, 18:00~익일 09:00) 중 실제 GPU가 activate된 시간의 비율' },
  { name: 'Slot Util', def: '할당된 GPU Slot 중 실제 점유 사용한 비율' },
];

type Tone = 'good' | 'warn' | 'bad' | 'none';

/** Light legend palette from the design's 임계 기준 chips (7164:7050-7076). */
const LIGHT_CHIP: Record<Tone, { bg: string; text: string }> = {
  good: { bg: '#F5FBEE', text: '#145C1C' },
  warn: { bg: '#FFF8ED', text: '#AB772A' },
  bad: { bg: '#FFF6F5', text: '#FF4337' },
  // 해당 구간이 정의되지 않은 지표 ('—') — 판정 미사용.
  none: { bg: '#F7F9FA', text: '#90969D' },
};

export default function MetricDefsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Header band + row styles mirror the ServiceListModal table.
  const th: CSSProperties = {
    height: 30,
    padding: '0 11px',
    background: tokenScreen.tableHeadBg,
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
    ...text.caption, // 400/12
    color: color.textTertiary,
    fontWeight: 400,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };
  const td: CSSProperties = {
    height: 40,
    padding: '0 11px',
    borderBottom: '1px solid #ECF1F5',
    verticalAlign: 'middle',
  };

  return (
    /* Transparent backdrop + right-anchored popover under the 지표 정의 button
       (2026-06-11 design: 'Popover' 380×560 r4, top-right — node 7164:7031). */
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="모니터링 지표 정의"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 60,
          right: 28,
          width: 380,
          maxWidth: 'calc(100vw - 56px)',
          maxHeight: 'calc(100vh - 84px)',
          background: color.white,
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,32,53,0.18), 0 0 2px rgba(40,48,55,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* HEADER — 52px + 1px #E4E9ED border (kit modal pattern) */}
        <div
          style={{
            height: 52,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 500, color: color.textSecondary }}>
            모니터링 지표 정의
          </span>
          <button
            type="button"
            className="gd-clickable"
            aria-label="닫기"
            onClick={onClose}
            style={{
              width: 20,
              height: 20,
              padding: 0,
              border: 'none',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 2L12 12M12 2L2 12" stroke={color.textSecondary} strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {/* BODY — definitions table + threshold legend */}
        <div style={{ padding: '24px 20px', overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 140 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th style={th}>지표</th>
                <th style={th}>정의</th>
              </tr>
            </thead>
            <tbody>
              {DEFS.map((d) => (
                <tr key={d.name}>
                  <td style={{ ...td, ...text.bodyM, color: color.textTitle }}>{d.name}</td>
                  <td style={{ ...td, ...text.body, color: color.textSecondary }}>{d.def}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 임계 기준 — 별도 표가 아니라 과제 등급 기준(GRADE_POLICY)을 지표
              단위로 펼친 것: 초록 = 우수 조건 · 빨강 = 용도별 저활용 조건 ·
              노랑 = 중간(둘 다 아님). 용도에 따라 구간이 달라 용도별 행으로
              표시한다. (디자인 #F6F8FA 박스 + 라이트 칩 포맷, node 7164:7048) */}
          <div
            style={{
              marginTop: 20,
              background: '#F6F8FA',
              borderRadius: radius.cell,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span style={{ ...text.body, color: color.textTitle }}>임계 기준 (지표 색상)</span>
            <span style={{ ...text.caption, color: color.textTertiary }}>
              표의 지표 색상은 아래 과제 등급 기준을 지표 단위로 평가한 것입니다 —{' '}
              <b style={{ fontWeight: 500, color: LIGHT_CHIP.good.text }}>초록</b> 우수 조건 충족 ·{' '}
              <b style={{ fontWeight: 500, color: LIGHT_CHIP.bad.text }}>빨강</b> 저활용 조건 해당 ·{' '}
              <b style={{ fontWeight: 500, color: LIGHT_CHIP.warn.text }}>노랑</b> 중간. 과제 용도에 따라 구간이 다릅니다.
            </span>
            {(['추론', '학습'] as const).map((task, ti) => (
              <div
                key={task}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingTop: ti > 0 ? 10 : 0,
                  borderTop: ti > 0 ? `1px solid ${color.border}` : undefined,
                }}
              >
                <span style={{ ...text.body, color: color.textTitle }}>{task}</span>
                {policyBands(task).map((pb) => (
                  <div key={pb.purpose} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ ...text.caption, color: color.textSecondary, fontWeight: 500 }}>
                      {pb.display}
                    </span>
                    {pb.bands.map((b) => (
                      <div key={b.metric} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 76, flexShrink: 0, ...text.caption, color: color.textTertiary }}>
                          {b.metricLabel}
                        </span>
                        {([
                          [b.good, 'good'],
                          [b.warn, 'warn'],
                          [b.bad, 'bad'],
                        ] as const).map(([label, tone], i) => {
                          const t: Tone = label == null ? 'none' : tone;
                          return (
                            <span
                              key={i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 56,
                                height: 18,
                                boxSizing: 'border-box',
                                padding: '0 6px',
                                borderRadius: radius.cell,
                                background: LIGHT_CHIP[t].bg,
                                color: LIGHT_CHIP[t].text,
                                fontSize: 11,
                                lineHeight: '12px',
                                fontWeight: 400,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {label ?? '—'}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <span style={{ ...text.caption, color: color.textTertiary }}>
              · GPU Util AH(비근무)는 참고 지표로, 등급 판정에 사용되지 않습니다 (회색 표시).
            </span>
          </div>

          {/* 과제 등급 기준 — lib/gradePolicy.ts GRADE_POLICY에서 자동 파생.
              위 임계 기준(지표 색상)과 같은 규칙의 문장형 표기: 등급 태그는
              규칙 전체(and/or 조합)로, 지표 색상은 지표 단위로 판정된다. */}
          <div style={{ marginTop: 20, ...text.label, color: color.textTertiary }}>
            과제 등급 기준 (태스크 · 용도별)
          </div>
          <div style={{ marginTop: 4, ...text.caption, color: color.textTertiary }}>
            과제 등급(우수/저활용)은 태스크(추론/학습)와 과제 성격(용도)에 따라 기준이 다릅니다.
            위 임계 기준 표는 이 규칙을 지표 단위 구간으로 펼친 것입니다.
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.keys(GRADE_POLICY) as Array<keyof typeof GRADE_POLICY>).map((task) => (
              <div key={task} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ ...text.bodyM, color: color.textTitle }}>{task}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GradeBadge grade="우수" />
                  <span style={{ ...text.body, color: color.textSecondary }}>{goodLabel(task)}</span>
                </div>
                {Object.entries(GRADE_POLICY[task].reclaim).map(([purpose, rule]) => (
                  <div key={purpose} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GradeBadge grade="저활용" />
                    <span style={{ ...text.bodyM, color: color.textTitle, width: 104 }}>
                      {purposeDisplay(task, purpose)}
                    </span>
                    <span style={{ ...text.body, color: color.textSecondary }}>{ruleLabel(rule)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ ...text.caption, color: color.textTertiary }}>
              · 저활용 과제는 회수 대상이며, 펼침 상세의 '저활용 회수 예상량'에서 기준별 회수 수량을 확인할 수 있습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
