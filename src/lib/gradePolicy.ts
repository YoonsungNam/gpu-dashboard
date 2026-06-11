import type { TaskType } from '../mock/types';

/**
 * 과제 등급 운영 정책 — ★운영자가 수정하는 곳은 GRADE_POLICY 하나뿐★
 *
 * 평가 로직(gradeOf), Overview 점검 카드의 기준 캡션, 지표 정의 모달의
 * '과제 등급 기준' 표, 점검 배지 색상 임계가 모두 이 객체에서 파생되므로
 * 숫자/연산자/조합(and·or)을 바꾸면 화면 전체가 함께 갱신됩니다.
 *
 * metric: 'gpu' = GPU Util · 'wh' = GPU Util WH · 'slot' = Slot Util
 * reclaim 키는 과제 용도(purpose); 목록에 없는 용도는 '기타' 규칙을 따릅니다.
 */
export type GradeMetric = 'gpu' | 'wh' | 'slot';
export type GradeOp = '>=' | '>' | '<=' | '<';
export interface GradeCond {
  metric: GradeMetric;
  op: GradeOp;
  value: number;
}
export interface GradeRule {
  combine: 'and' | 'or';
  conds: GradeCond[];
}
export interface TaskGradePolicy {
  /** 우수 판정 규칙 (용도 무관) */
  good: GradeRule;
  /** 용도별 저활용 판정 규칙 — '기타'는 미등록 용도의 폴백 */
  reclaim: Record<string, GradeRule>;
  /** 점검 카드 배지(셀) 색상 임계: good 이상 초록 · bad 이하 빨강 · 사이 주황 */
  badge: { gpu: { good: number; bad: number }; slot: { good: number; bad: number } };
}

export const GRADE_POLICY: Record<TaskType, TaskGradePolicy> = {
  추론: {
    // 추론 우수: GPU Util ≥ 40%
    good: { combine: 'and', conds: [{ metric: 'gpu', op: '>=', value: 40 }] },
    reclaim: {
      // 생산시스템 연계: GPU Util < 5% or Slot Util ≤ 75%
      '생산시스템 연계': {
        combine: 'or',
        conds: [
          { metric: 'gpu', op: '<', value: 5 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
      // 일반(기타): GPU Util WH < 30% or Slot Util ≤ 75%
      기타: {
        combine: 'or',
        conds: [
          { metric: 'wh', op: '<', value: 30 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
    },
    badge: { gpu: { good: 40, bad: 5 }, slot: { good: 80, bad: 75 } },
  },
  학습: {
    // 학습 우수: GPU Util ≥ 50% and Slot Util ≥ 80%
    good: {
      combine: 'and',
      conds: [
        { metric: 'gpu', op: '>=', value: 50 },
        { metric: 'slot', op: '>=', value: 80 },
      ],
    },
    reclaim: {
      // 모델 학습: GPU Util ≤ 30% or Slot Util ≤ 75%
      '모델 학습': {
        combine: 'or',
        conds: [
          { metric: 'gpu', op: '<=', value: 30 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
      // 모델 개발: GPU Util ≤ 5% or Slot Util ≤ 75%
      '모델 개발': {
        combine: 'or',
        conds: [
          { metric: 'gpu', op: '<=', value: 5 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
      기타: {
        combine: 'or',
        conds: [
          { metric: 'gpu', op: '<=', value: 30 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
    },
    badge: { gpu: { good: 50, bad: 30 }, slot: { good: 80, bad: 75 } },
  },
};

/* ------------------------------------------------------------------ */
/* 파생 — 아래는 수정할 필요 없음                                          */
/* ------------------------------------------------------------------ */

export interface GradeValues {
  gpu: number;
  wh: number;
  slot: number;
}

const METRIC_LABEL: Record<GradeMetric, string> = {
  gpu: 'GPU Util',
  wh: 'GPU Util WH',
  slot: 'Slot Util',
};
const OP_LABEL: Record<GradeOp, string> = { '>=': '≥', '>': '>', '<=': '≤', '<': '<' };

function holds(cond: GradeCond, v: GradeValues): boolean {
  const x = v[cond.metric];
  switch (cond.op) {
    case '>=': return x >= cond.value;
    case '>': return x > cond.value;
    case '<=': return x <= cond.value;
    case '<': return x < cond.value;
  }
}

export function evalRule(rule: GradeRule, v: GradeValues): boolean {
  return rule.combine === 'and' ? rule.conds.every((c) => holds(c, v)) : rule.conds.some((c) => holds(c, v));
}

/** 과제 등급 판정 — 우수 우선, 아니면 용도별 저활용, 둘 다 아니면 null. */
export function gradeOf(task: TaskType, purpose: string, v: GradeValues): '우수' | '저활용' | null {
  const p = GRADE_POLICY[task];
  if (evalRule(p.good, v)) return '우수';
  const rule = p.reclaim[purpose] ?? p.reclaim['기타'];
  if (rule && evalRule(rule, v)) return '저활용';
  return null;
}

/** 'GPU Util ≥ 40%' / 'GPU Util WH < 30% or Slot Util ≤ 75%' 형태의 규칙 문자열. */
export function ruleLabel(rule: GradeRule): string {
  return rule.conds
    .map((c) => `${METRIC_LABEL[c.metric]} ${OP_LABEL[c.op]} ${c.value}%`)
    .join(` ${rule.combine} `);
}

/** Overview 점검 카드 캡션: 우수 기준. */
export function goodLabel(task: TaskType): string {
  return ruleLabel(GRADE_POLICY[task].good);
}

/** Overview 점검 카드 캡션: 용도별 저활용 기준 ('기타' → '일반' 표기). */
export function reclaimLabel(task: TaskType): string {
  return Object.entries(GRADE_POLICY[task].reclaim)
    .map(([purpose, rule]) => `${purpose === '기타' ? '일반' : purpose}: ${ruleLabel(rule)}`)
    .join(', ');
}
