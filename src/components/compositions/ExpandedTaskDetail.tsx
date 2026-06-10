import type { CSSProperties } from 'react';
import { color, radius, text } from '../../tokens';
import { utilLevel, type UtilMetric } from '../../lib/util';
import { GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL, type MetricDef } from '../../lib/labels';
import type {
  ProjectUnit,
  ProjectUnitInfo,
  ProjectUnitsResponse,
  TaskType,
} from '../../mock/types';
import TaskTypeBadge, { kindOf } from '../primitives/TaskTypeBadge';
import RecallEstimateCard from './RecallEstimateCard';

/* v2 expanded-detail palette (nodes 7104:9750-9791 / 7104:11131-11236). */
const KPI_GOOD_TEXT = '#145C1C';
const KPI_BAD_TEXT = '#D2362C';
const BAR_GOOD = '#55C961';
const BAR_BAD = '#FF4337';
const UNIT_GOOD_TEXT = '#239B2F';
const UNIT_BAD_TEXT = '#FF4337';

/** Section heading: 500/14 #3C444B ('활용 지표' / '저활용 회수 예상량' / 'Unit 구성'). */
const HEADING = { ...text.bodyM, color: color.textTitle } as const;

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** Reads a (possibly optional) utilization field off info/unit, defaulting to 0. */
function utilOf(obj: ProjectUnitInfo | ProjectUnit, key: string): number {
  return (obj as unknown as Record<string, number | undefined>)[key] ?? 0;
}

/** KPI strip metric set per task (추론 = 4 metrics, 학습 = GPU Util + GPU Util WH only). */
const KPI_METRICS: Record<TaskType, MetricDef[]> = {
  추론: [GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL],
  학습: [GPU_UTIL, GPU_UTIL_WH],
};

/** Unit 구성 util columns — SHORT header labels (추론: GPU/GPU WH/GPU AH/Slot; 학습: GPU/Slot). */
interface UnitColDef {
  key: string;
  label: string;
  metric: UtilMetric;
}
const UNIT_UTIL_COLS: Record<TaskType, UnitColDef[]> = {
  추론: [
    { key: 'gpu_ut', label: 'GPU', metric: 'gpu' },
    { key: 'gpu_ut_working', label: 'GPU WH', metric: 'gpu' },
    { key: 'gpu_ut_nonworking', label: 'GPU AH', metric: 'gpu' },
    { key: 'slot_ut', label: 'Slot', metric: 'slot' },
  ],
  학습: [
    { key: 'gpu_ut', label: 'GPU', metric: 'gpu' },
    { key: 'slot_ut', label: 'Slot', metric: 'slot' },
  ],
};

export interface ExpandedTaskDetailProps {
  data: ProjectUnitsResponse;
  /** v2: the task scope of the expand (drives KPI set, unit columns, recall section). */
  taskType?: TaskType;
  /** Legacy alias (= [taskType]); kept so existing call sites compile. */
  tasks?: TaskType[];
  /** Renders the '전략' pill in the tag cluster. */
  isStrategic?: boolean;
  /** Legacy alias of isStrategic. */
  isCritical?: boolean;
  leadCount?: number;
  /** Panel background — overview passes '#F2F6F9', resource default '#F6F8FA'. */
  bg?: string;
}

/**
 * Inline expanded-row detail shared by the Overview and GPU 활용 현황 screens
 * (v2 — Figma Expand frames 7104:9650 / 7104:11131). Renders the 활용 지표
 * strip (separate white 90px cards), the optional 저활용 회수 예상량 gauges,
 * and the Unit 구성 sub-table. Pure presentational; spans the full panel
 * width (caller removes the panel padding via DataTable panelStyle).
 */
export default function ExpandedTaskDetail({
  data,
  taskType,
  tasks,
  isStrategic,
  isCritical,
  leadCount,
  bg = '#F6F8FA',
}: ExpandedTaskDetailProps) {
  const task: TaskType = taskType ?? tasks?.[0] ?? '추론';
  const strategic = isStrategic ?? isCritical ?? false;
  const { info, units } = data;
  const lead = leadCount ?? units.reduce((sum, u) => sum + u.gpu_num, 0);

  // 저활용 회수 예상량 — shown on 학습 expands and whenever any basis reclaims.
  const re = info.reclaim_estimate;
  const showRecall =
    !!re && (task === '학습' || re.gpu.reclaim_count > 0 || re.slot.reclaim_count > 0);

  const unitCols = UNIT_UTIL_COLS[task];

  /* ---- Unit 구성 sub-table cell styles (header 28px, rows 41px) ---- */
  const th = (first = false): CSSProperties => ({
    ...text.label,
    color: color.textTertiary,
    textAlign: first ? 'left' : 'center',
    padding: first ? '7px 8px 7px 12px' : '7px 8px',
    background: '#FAFBFC',
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
    whiteSpace: 'nowrap',
  });
  const td = (first = false): CSSProperties => ({
    ...text.body,
    color: color.textTitle,
    textAlign: first ? 'left' : 'center',
    padding: first ? '10px 8px 10px 12px' : '10px 8px',
    borderBottom: `1px solid ${color.border}`,
    verticalAlign: 'middle',
  });

  return (
    <div
      style={{
        background: bg,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ---- 활용 지표: heading + tag cluster + KPI card strip ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={HEADING}>활용 지표</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {strategic && <TaskTypeBadge kind="core" />}
            <TaskTypeBadge kind={kindOf(task)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
          {/* Lead card: count + '장' over '수량(H100)기준', centered */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: 90,
              boxSizing: 'border-box',
              background: color.cardBg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ ...text.metricLg, color: color.textTitle }}>{lead}</span>
              <span style={{ ...text.body, color: color.textSecondary }}>장</span>
            </span>
            <span style={{ ...text.caption, color: color.textTertiary }}>수량(H100)기준</span>
          </div>

          {/* Metric cards: label / value+% / threshold-colored bar */}
          {KPI_METRICS[task].map((def) => {
            const value = utilOf(info, def.key);
            const good = utilLevel(value, def.metric) === 'good';
            return (
              <div
                key={def.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 90,
                  boxSizing: 'border-box',
                  background: color.cardBg,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ ...text.label, color: color.textTertiary }}>{def.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ ...text.metricLg, color: good ? KPI_GOOD_TEXT : KPI_BAD_TEXT }}>
                    {value.toFixed(1)}
                  </span>
                  <span style={{ ...text.body, color: color.textSecondary }}>%</span>
                </span>
                <div
                  style={{
                    height: 6,
                    borderRadius: radius.pill,
                    background: color.border,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${clamp(value)}%`,
                      height: '100%',
                      borderRadius: radius.pill,
                      background: good ? BAR_GOOD : BAR_BAD,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- 저활용 회수 예상량 (two target-vs-current gauges) ---- */}
      {showRecall && re && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={HEADING}>저활용 회수 예상량</span>
            <span style={{ ...text.caption, color: color.textTertiary }}>
              · 활용률 목표 미달에 따른 회수 대상 과제(회수 수량:목표치 달성 시의 H100 환산 잉여 자원)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
            <RecallEstimateCard basisLabel="GPU Util기준" basis={re.gpu} />
            <RecallEstimateCard basisLabel="Slot Util 기준" basis={re.slot} />
          </div>
        </div>
      )}

      {/* ---- Unit 구성 sub-table ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={HEADING}>Unit 구성</span>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            background: color.cardBg,
            border: `1px solid ${color.border}`,
          }}
        >
          <colgroup>
            <col style={{ width: '35%' }} />
            <col style={{ width: 120 }} />
            <col />
            {unitCols.map((c) => (
              <col key={c.key} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th style={th(true)}>Unit</th>
              <th style={th()}>모델</th>
              <th style={th()}>수량(H100기준)</th>
              {unitCols.map((c) => (
                <th key={c.key} style={th()}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.unit_id}>
                <td style={td(true)}>{u.unit_name}</td>
                <td style={td()}>{u.gpu_model}</td>
                <td style={td()}>{u.gpu_num}</td>
                {unitCols.map((c) => {
                  const v = utilOf(u, c.key);
                  const good = utilLevel(v, c.metric) === 'good';
                  return (
                    <td
                      key={c.key}
                      style={{
                        ...td(),
                        ...text.caption,
                        color: good ? UNIT_GOOD_TEXT : UNIT_BAD_TEXT,
                      }}
                    >
                      {v.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
