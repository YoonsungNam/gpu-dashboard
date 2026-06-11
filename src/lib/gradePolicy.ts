import type { TaskType } from '../mock/types';

/**
 * 과제 등급 운영 정책 — ★운영자가 수정하는 곳은 GRADE_POLICY 하나뿐★
 *
 * 평가 로직(gradeOf)뿐 아니라 화면의 모든 '임계 기준' 표시가 여기서 파생됩니다:
 * 셀/배지 색(policyLevel — 빨강=저활용 조건 해당 · 초록=우수 조건 충족 · 노랑=중간),
 * Overview 점검 카드의 기준 캡션, 지표 정의 패널의 임계 기준 표(policyBands)와
 * 과제 등급 기준 표. 숫자/연산자/조합(and·or)을 바꾸면 화면 전체가 함께 갱신됩니다.
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
      // 그 외 추론 용도(일반업무·서비스테스트): GPU Util WH < 30% or Slot Util ≤ 75%
      기타: {
        combine: 'or',
        conds: [
          { metric: 'wh', op: '<', value: 30 },
          { metric: 'slot', op: '<=', value: 75 },
        ],
      },
    },
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
      // 학습 용도는 모델 학습/모델 개발 2분류뿐이라 '기타' 폴백이 필요 없다
      // (2026-06-11 피드백). 새 용도가 생기면 여기에 규칙을 추가하면 된다.
    },
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
/** 반대 구간 표기 ('우수 ≥ 40' → 중간은 '< 40'). */
const OP_OPPOSITE: Record<GradeOp, string> = { '>=': '<', '>': '≤', '<=': '>', '<': '≥' };

function holdsVal(cond: GradeCond, x: number): boolean {
  switch (cond.op) {
    case '>=': return x >= cond.value;
    case '>': return x > cond.value;
    case '<=': return x <= cond.value;
    case '<': return x < cond.value;
  }
}

function holds(cond: GradeCond, v: GradeValues): boolean {
  return holdsVal(cond, v[cond.metric]);
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

/** '기타' 폴백 키의 화면 표기 (추론의 미등록 용도 = 일반업무·서비스테스트 등). */
export function purposeDisplay(task: TaskType, purposeKey: string): string {
  if (purposeKey !== '기타') return purposeKey;
  return task === '추론' ? '일반업무 등' : '기타 용도';
}

/** Overview 점검 카드 캡션: 용도별 저활용 기준 ('기타' → '일반업무 등' 표기). */
export function reclaimLabel(task: TaskType): string {
  return Object.entries(GRADE_POLICY[task].reclaim)
    .map(([purpose, rule]) => `${purposeDisplay(task, purpose)}: ${ruleLabel(rule)}`)
    .join(', ');
}

/* ------------------------------------------------------------------ */
/* 임계 기준(셀/배지 색상) — 등급 규칙에서 직접 파생                          */
/*                                                                      */
/* '임계 기준'과 '과제 등급 기준'은 별개의 체계가 아닙니다: 지표 색상은        */
/* 해당 과제의 용도에 적용되는 등급 규칙을 지표 단위로 평가한 결과입니다.      */
/*   빨강(bad)  = 그 용도의 저활용 조건 중 이 지표의 조건에 해당              */
/*   초록(good) = 우수 조건 중 이 지표의 조건을 충족                         */
/*   노랑(warn) = 둘 다 아님(중간)                                          */
/*   없음(none) = 이 지표가 해당 용도의 판정에 사용되지 않음 (예: GPU AH)     */
/* ------------------------------------------------------------------ */

/** 화면 지표 키 — 등급 규칙의 GradeMetric + 판정 미사용 지표(ah). */
export type PolicyMetric = GradeMetric | 'ah';
export type PolicyLevel = 'good' | 'warn' | 'bad' | 'none';

/**
 * (태스크, 용도, 지표, 값) → 표시 색상 단계.
 * purpose가 null이면 집계(평균) 맥락: 어느 용도 규칙이든 이 지표의 저활용
 * 조건에 걸리면 빨강 — KPI 평균처럼 용도가 섞인 수치에 사용합니다.
 */
export function policyLevel(
  task: TaskType,
  purpose: string | null,
  metric: PolicyMetric,
  value: number,
): PolicyLevel {
  if (metric === 'ah') return 'none'; // 비근무 지표는 등급 판정에 미사용 (참고용)
  const p = GRADE_POLICY[task];
  const rules =
    purpose == null
      ? Object.values(p.reclaim)
      : [p.reclaim[purpose] ?? p.reclaim['기타']].filter(Boolean);
  const badConds = rules.flatMap((r) => r.conds.filter((c) => c.metric === metric));
  const goodCond = p.good.conds.find((c) => c.metric === metric);
  if (badConds.some((c) => holdsVal(c, value))) return 'bad';
  if (goodCond && holdsVal(goodCond, value)) return 'good';
  if (!goodCond && badConds.length === 0) return 'none';
  return 'warn';
}

/**
 * 용도의 저활용 규칙 조건 목록 — '저활용 회수 예상량' 게이지 구성용.
 * 게이지의 목표값 = 그 지표의 저활용 조건 경계값 (이를 넘어서면 기준 탈출).
 * 예: 생산시스템 연계는 GPU Util 5% · Slot Util 75%, 일반업무 등은
 * GPU Util WH 30% · Slot Util 75% — 지표 정의 패널의 임계 기준과 항상 일치.
 */
export interface ReclaimCond extends GradeCond {
  label: string;
}
export function reclaimConds(task: TaskType, purpose: string): ReclaimCond[] {
  const rule = GRADE_POLICY[task].reclaim[purpose] ?? GRADE_POLICY[task].reclaim['기타'];
  return rule ? rule.conds.map((c) => ({ ...c, label: METRIC_LABEL[c.metric] })) : [];
}

/** 지표 정의 패널의 임계 기준 표 한 칸 — null이면 그 구간이 정의되지 않음('—'). */
export interface PolicyBand {
  metric: GradeMetric;
  metricLabel: string;
  good: string | null;
  warn: string;
  bad: string | null;
}
export interface PurposeBands {
  /** reclaim 키 (폴백은 '기타'). */
  purpose: string;
  /** 화면 표기 (기타 → '일반업무 등' 등). */
  display: string;
  bands: PolicyBand[];
}

/**
 * 태스크별 × 용도별 임계 구간표 — 디자인의 [초록|노랑|빨강] 칩 그리드용.
 * 우수/저활용 규칙에 등장하는 지표만 행으로 만들고, 한쪽 구간이 없는 지표는
 * 그 자리를 null('—')로 둡니다. 노랑은 항상 '둘 다 아님' 구간입니다.
 */
export function policyBands(task: TaskType): PurposeBands[] {
  const p = GRADE_POLICY[task];
  const ORDER: GradeMetric[] = ['gpu', 'wh', 'slot'];
  return Object.entries(p.reclaim).map(([purpose, rule]) => {
    const metrics = ORDER.filter(
      (m) => p.good.conds.some((c) => c.metric === m) || rule.conds.some((c) => c.metric === m),
    );
    const bands = metrics.map((m): PolicyBand => {
      const g = p.good.conds.find((c) => c.metric === m);
      const b = rule.conds.find((c) => c.metric === m);
      const fmt = (c: GradeCond) => `${OP_LABEL[c.op]} ${c.value}%`;
      let warn: string;
      if (g && b) warn = `${b.value}-${g.value}%`;
      else if (g) warn = `${OP_OPPOSITE[g.op]} ${g.value}%`;
      else if (b) warn = `${OP_OPPOSITE[b.op]} ${b.value}%`;
      else warn = '—';
      return {
        metric: m,
        metricLabel: METRIC_LABEL[m],
        good: g ? fmt(g) : null,
        warn,
        bad: b ? fmt(b) : null,
      };
    });
    return { purpose, display: purposeDisplay(task, purpose), bands };
  });
}
