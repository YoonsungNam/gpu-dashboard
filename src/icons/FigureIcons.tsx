/**
 * Figure / table icons transcribed from the actual Figma vectors:
 *   - BrainstormIcon  → 'icon/icon20-Brainstorming' (node 7001:46400) — Inference card title
 *   - DictIcon        → 'icon/icon20-dict'          (node 7001:46430) — Training card title
 *   - ChevronRightIcon→ 'Icon/Icon14-Chevron-S_Right'(node 7001:46498) — table row expand
 *   - CaretDownIcon   → 'icon_only_Basic'           (node 7001:46454) — select dropdowns
 *
 * The two card icons are multi-color illustrations whose palette IS the card
 * accent (teal for inference, purple for training), so their fills are kept
 * literal. The chevron/caret are monochrome strokes → `currentColor`.
 */
import { useId } from 'react';

type IconProps = { size?: number };
type StrokeIconProps = { size?: number; color?: string };

/** Inference accent illustration (brainstorm / idea bulb). */
export function BrainstormIcon({ size = 20 }: IconProps) {
  // Namespace the clip/mask ids so multiple instances on one page don't collide.
  const raw = useId().replace(/:/g, '');
  const clipId = `bs-clip-${raw}`;
  const maskId = `bs-mask-${raw}`;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M2.67157 12.3284L3.5 11.5L7.5 10.5H14.5C14.5 10.5 16.5 11.5 16.5 15C16.5 18.5 14 19.5 14 19.5H5L4.5 18.8333C3.85089 17.9679 3.5 16.9152 3.5 15.8333V15.5H1.5V15.1569C1.5 14.096 1.92143 13.0786 2.67157 12.3284Z"
          fill="#EDF2F4"
          stroke="#004457"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path d="M2.5 4.5L4 6" stroke="#00546B" strokeLinecap="round" />
      <path d="M17.5 4.5L16 6" stroke="#00546B" strokeLinecap="round" />
      <path d="M6.5 0.5L7.5 2.5" stroke="#00546B" strokeLinecap="round" />
      <path d="M13.5 0.5L12.5 2.5" stroke="#00546B" strokeLinecap="round" />
      <mask id={maskId} fill="white">
        <path d="M8.5 4C9.61583 4 10.6091 4.52263 11.25 5.33594C11.6179 5.12299 12.0444 5 12.5 5C13.7245 5 14.7411 5.88071 14.9561 7.04297C16.1189 7.25743 17 8.27514 17 9.5C17 10.7761 16.0436 11.8263 14.8086 11.9785C14.3351 13.1547 13.0331 14 11.5 14C10.6387 14 9.85092 13.7323 9.24121 13.29C8.79088 13.7282 8.17792 14 7.5 14C6.29051 14 5.28142 13.1411 5.0498 12H5V11.9492C3.85895 11.7175 3 10.7094 3 9.5C3 8.2799 3.87418 7.26478 5.03027 7.04492C5.25339 5.32699 6.72127 4 8.5 4Z" />
      </mask>
      <path
        d="M8.5 4C9.61583 4 10.6091 4.52263 11.25 5.33594C11.6179 5.12299 12.0444 5 12.5 5C13.7245 5 14.7411 5.88071 14.9561 7.04297C16.1189 7.25743 17 8.27514 17 9.5C17 10.7761 16.0436 11.8263 14.8086 11.9785C14.3351 13.1547 13.0331 14 11.5 14C10.6387 14 9.85092 13.7323 9.24121 13.29C8.79088 13.7282 8.17792 14 7.5 14C6.29051 14 5.28142 13.1411 5.0498 12H5V11.9492C3.85895 11.7175 3 10.7094 3 9.5C3 8.2799 3.87418 7.26478 5.03027 7.04492C5.25339 5.32699 6.72127 4 8.5 4Z"
        fill="#B3E8F6"
      />
      <path
        d="M11.25 5.33594L10.4646 5.95488L11.001 6.63556L11.751 6.20139L11.25 5.33594ZM14.9561 7.04297L13.9727 7.22479L14.0979 7.90155L14.7747 8.02638L14.9561 7.04297ZM14.8086 11.9785L14.6863 10.986L14.1011 11.0581L13.8809 11.6051L14.8086 11.9785ZM9.24121 13.29L9.82834 12.4805L9.14709 11.9864L8.54389 12.5733L9.24121 13.29ZM5.0498 12L6.02982 11.8011L5.86722 11H5.0498V12ZM5 12H4V13H5V12ZM5 11.9492H6V11.1319L5.19899 10.9692L5 11.9492ZM5.03027 7.04492L5.2171 8.02732L5.92866 7.89199L6.02194 7.17372L5.03027 7.04492ZM8.5 4V5C9.29604 5 10.0048 5.37145 10.4646 5.95488L11.25 5.33594L12.0354 4.717C11.2134 3.67382 9.93562 3 8.5 3V4ZM11.25 5.33594L11.751 6.20139C11.9724 6.07322 12.2269 6 12.5 6V5V4C11.8618 4 11.2633 4.17277 10.749 4.47048L11.25 5.33594ZM12.5 5V6C13.2323 6 13.8436 6.52674 13.9727 7.22479L14.9561 7.04297L15.9394 6.86114C15.6386 5.23468 14.2166 4 12.5 4V5ZM14.9561 7.04297L14.7747 8.02638C15.4726 8.1551 16 8.767 16 9.5H17H18C18 7.78327 16.7651 6.35976 15.1374 6.05955L14.9561 7.04297ZM17 9.5H16C16 10.2635 15.4277 10.8947 14.6863 10.986L14.8086 11.9785L14.9309 12.971C16.6594 12.758 18 11.2888 18 9.5H17ZM14.8086 11.9785L13.8809 11.6051C13.5819 12.3479 12.6875 13 11.5 13V14V15C13.3787 15 15.0884 13.9615 15.7363 12.3519L14.8086 11.9785ZM11.5 14V13C10.8451 13 10.2637 12.7963 9.82834 12.4805L9.24121 13.29L8.65408 14.0995C9.43816 14.6682 10.4324 15 11.5 15V14ZM9.24121 13.29L8.54389 12.5733C8.27055 12.8392 7.90425 13 7.5 13V14V15C8.45159 15 9.3112 14.6171 9.93854 14.0068L9.24121 13.29ZM7.5 14V13C6.77535 13 6.16868 12.4852 6.02982 11.8011L5.0498 12L4.06979 12.1989C4.39417 13.7971 5.80567 15 7.5 15V14ZM5.0498 12V11H5V12V13H5.0498V12ZM5 12H6V11.9492H5H4V12H5ZM5 11.9492L5.19899 10.9692C4.51434 10.8302 4 10.224 4 9.5H3H2C2 11.1948 3.20357 12.6049 4.80101 12.9292L5 11.9492ZM3 9.5H4C4 8.76955 4.5235 8.15922 5.2171 8.02732L5.03027 7.04492L4.84345 6.06253C3.22486 6.37034 2 7.79026 2 9.5H3ZM5.03027 7.04492L6.02194 7.17372C6.18123 5.94724 7.23065 5 8.5 5V4V3C6.21189 3 4.32555 4.70674 4.0386 6.91613L5.03027 7.04492Z"
        fill="#004457"
        mask={`url(#${maskId})`}
      />
      <path d="M5.5 7.5V8C5.5 8.82843 6.17157 9.5 7 9.5" stroke="#004457" />
      <path d="M14.5 11.5L13.7929 10.7929C13.6054 10.6054 13.351 10.5 13.0858 10.5H12" stroke="#004457" />
      <path d="M12 5.5L11.3906 5.90627C10.8342 6.2772 10.5 6.90166 10.5 7.57037V8" stroke="#004457" />
      <defs>
        <clipPath id={clipId}>
          <rect width="17" height="8.5" fill="white" transform="translate(0.5 10.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Training accent illustration (open dictionary / book). */
export function DictIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M1.5 6C1.5 5.72386 1.72386 5.5 2 5.5H18C18.2761 5.5 18.5 5.72386 18.5 6V17C18.5 17.2761 18.2761 17.5 18 17.5H2C1.72386 17.5 1.5 17.2761 1.5 17V6Z"
        fill="#C8BEF6"
        stroke="#3A4571"
      />
      <path
        d="M3.5 4C3.5 3.72386 3.72386 3.5 4 3.5H8.47288C8.64527 3.5 8.80551 3.58881 8.89688 3.735L9.576 4.8216C9.77183 5.13494 10.2282 5.13494 10.424 4.8216L11.1031 3.735C11.1945 3.58881 11.3547 3.5 11.5271 3.5H16C16.2761 3.5 16.5 3.72386 16.5 4V15C16.5 15.2761 16.2761 15.5 16 15.5H4C3.72386 15.5 3.5 15.2761 3.5 15V4Z"
        fill="white"
        stroke="#3A4571"
      />
      <rect x="5" y="7" width="3.5" height="1" fill="#3A4571" />
      <rect x="11.5" y="7" width="3.5" height="1" fill="#3A4571" />
      <rect x="5" y="9" width="3.5" height="1" fill="#3A4571" />
      <rect x="11.5" y="9" width="3.5" height="1" fill="#3A4571" />
      <rect x="5" y="11" width="3.5" height="1" fill="#3A4571" />
      <rect x="11.5" y="11" width="3.5" height="1" fill="#3A4571" />
      <path d="M10 7L10 13" stroke="#3A4571" />
    </svg>
  );
}

/** Per-task accent icon for card titles. */
export function TaskIcon({ kind, size = 20 }: { kind: 'inference' | 'training'; size?: number }) {
  return kind === 'training' ? <DictIcon size={size} /> : <BrainstormIcon size={size} />;
}

/** Row-expand chevron (points right when collapsed). */
export function ChevronRightIcon({ size = 14, color = 'currentColor' }: StrokeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M6 4L9 7L6 10" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

/** Select / dropdown caret. */
export function CaretDownIcon({ size = 16, color = 'currentColor' }: StrokeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M12 6L8 10L4 6" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 토큰 활용 현황 KPI glyphs (node 7104:3444 'ServiceCount' icon set)     */
/* ------------------------------------------------------------------ */

/** ① 서비스 그룹 — 리스트 글리프: 3×(4×4 사각 + 10×4 막대), #E4E9ED (2026-06-11, node 7164:6715). */
export function ServiceGroupIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {[2, 8, 14].map((y) => (
        <g key={y}>
          <rect x="2" y={y} width="4" height="4" fill="#E4E9ED" />
          <rect x="8" y={y} width="10" height="4" fill="#E4E9ED" />
        </g>
      ))}
    </svg>
  );
}

/** ② 서비스 — 6×6 사각 3개 + 인디고 플러스 (node 7164:6727). */
export function ServiceIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="6" height="6" fill="#E4E9ED" />
      <rect x="11" y="2" width="6" height="6" fill="#E4E9ED" />
      <rect x="2" y="11" width="6" height="6" fill="#E4E9ED" />
      <path d="M13 11v9M9.5 15.5h8" stroke="#6471DF" strokeWidth="3" />
    </svg>
  );
}

/** ③ 일평균 토큰 합계 — 14×14 외곽 박스 + 인디고/그레이 플러스 (node 7164:6739). */
export function TokenSumIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2.5" width="13" height="13" stroke="#E4E9ED" strokeWidth="1.5" />
      <path d="M12.5 8v10M8 12.5h9.5" stroke="#6471DF" strokeWidth="3.2" />
      <path d="M6 4v6M3 7h6" stroke="#767D84" strokeWidth="2.2" />
    </svg>
  );
}

/**
 * Funnel glyph for the 등급 필터 button (btn_2ndary icon, 14px).
 * Figma Icon14-Filter is a SOLID filled funnel (union 8x10) — fill, not stroke.
 */
export function FilterIcon({ size = 14, color = 'currentColor' }: StrokeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 3h8v1.5L8.2 7.5v4L5.8 9.8V7.5L3 4.5V3z" fill={color} />
    </svg>
  );
}

/**
 * 14x14 square-i info icon for the 지표 정의 ghost button
 * (Figma Rectangle 881 13x13 r1 outline + 2x2 dot + 2x5 bar, nodes 221:53776-53778).
 */
export function InfoIcon({ size = 14, color = '#767D84' }: StrokeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {/* Figma renders the box outline at ~15% opacity (#ECF1F5 on white); the 'i' stays solid. */}
      <rect x="0.5" y="0.5" width="13" height="13" rx="1" stroke="rgba(118,125,132,0.15)" />
      <rect x="6" y="3" width="2" height="2" fill={color} />
      <rect x="6" y="6" width="2" height="5" fill={color} />
    </svg>
  );
}
