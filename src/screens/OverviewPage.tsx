import { useMemo, useState } from 'react';
import { chart, color, radius, semantic, space, text, tokenScreen } from '../tokens';
import { num, pct, utilLevel } from '../lib/util';
import { GRADE_POLICY, goodLabel, reclaimLabel } from '../lib/gradePolicy';
import { GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL } from '../lib/labels';

import SectionHeader from '../components/primitives/SectionHeader';
import Card from '../components/primitives/Card';
import ProgressBar from '../components/primitives/ProgressBar';
import Legend from '../components/primitives/Legend';
import DataTable, { type DataTableColumn } from '../components/primitives/DataTable';
import { TaskIcon } from '../icons/FigureIcons';

import StackedBar from '../components/charts/StackedBar';
import TrendChart, { type TrendSeries } from '../components/charts/TrendChart';
import ExpandedTaskDetail from '../components/compositions/ExpandedTaskDetail';

import type { KpiByTask, RankedProject, TaskType } from '../mock/types';
import {
  type GlobalFilters,
  getKpiByTask,
  getRankByTask,
  getUtilTrend,
  getProjectUnits,
  gpuCountByTask,
  quotaByEnvGpu,
  trendAvg,
} from '../mock/data';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Map a Korean task label to the task-card accent kind. */
const taskKind = (task: TaskType): 'inference' | 'training' =>
  task === '학습' ? 'training' : 'inference';

/**
 * Per-task accent — v2 keeps the accent only on the big metric numbers
 * (inference #007492, training #5A4F8C — nodes 7104:14023/14344/14878).
 * The headerRight "N Projects" counter is neutral #565E66 per the v2 export.
 */
const TASK_ACCENT = {
  inference: { metric: '#007492' },
  training: { metric: '#5A4F8C' },
} as const;

/** Card title: real 20px task icon + neutral "Inference / 추론" text (+ optional caption). */
function TaskCardTitle({ kind, caption }: { kind: 'inference' | 'training'; caption?: string }) {
  const title = kind === 'training' ? 'Training / 학습' : 'Inference / 추론';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <TaskIcon kind={kind} size={20} />
      <span style={{ ...text.cardTitle, color: color.textPrimary }}>{title}</span>
      {caption && (
        <span style={{ ...text.caption, color: color.textTitle, marginLeft: space.xs }}>{caption}</span>
      )}
    </span>
  );
}

/** v2 task-card header: plain white 56px strip (18px vertical pad + 20px title line). */
const TASK_HEADER_STYLE = { padding: `18px ${space.xl}px` } as const;

/** Two-column grid used by sections 1, 3, 4 (추론 | 학습). */
function TwoCol({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: space.xl,
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  );
}

/** Section wrapper: SectionHeader + content, with vertical rhythm. Clicking the
 *  header marker button collapses/expands the section content (local state only). */
function Section({
  id,
  title,
  caption,
  defaultCollapsed = false,
  children,
}: {
  id?: string;
  title: string;
  caption?: string;
  /** 보유현황 starts collapsed per user feedback; others open. */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section id={id} style={{ marginBottom: space.xxl + space.lg }}>
      <SectionHeader
        title={title}
        caption={caption}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      {!collapsed && children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* §1 — GPU 활용현황                                                    */
/* ------------------------------------------------------------------ */

/** Reads a (possibly optional) KPI util field, defaulting to 0. */
function kpiVal(kpi: KpiByTask, key: string): number {
  const map: Record<string, number | undefined> = {
    gpu_ut: kpi.avg_gpu_ut,
    gpu_ut_working: kpi.avg_gpu_ut_working,
    gpu_ut_nonworking: kpi.avg_gpu_ut_nonworking,
    slot_ut: kpi.avg_slot_ut,
  };
  return map[key] ?? 0;
}

// Exact bar/value colors from the Figma 활용현황 card (solid bars + colored number;
// bad = bar #FF8E87 / number #FF4337, per nodes 7001:46388 / 46385).
const BAR_FILL: Record<string, string> = { good: '#55C961', warn: '#FFC46B', bad: '#FF8E87' };
const BAR_VALUE: Record<string, string> = { good: '#239B2F', warn: '#D59638', bad: '#FF4337' };

function UtilRow({
  label,
  value,
  metric,
  task,
}: {
  label: string;
  value: number;
  metric: 'gpu' | 'slot';
  task: TaskType;
}) {
  const lvl = utilLevel(value, metric, task);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
      <span
        style={{
          ...text.body,
          color: color.textTitle,
          width: 86,
          flex: '0 0 86px',
        }}
      >
        {label}
      </span>
      <ProgressBar value={value} color={BAR_FILL[lvl]} trackColor="#E9EEF2" />
      <span
        style={{
          flex: '0 0 64px',
          textAlign: 'right',
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <span style={{ fontSize: 20, lineHeight: '24px', fontWeight: 600, color: BAR_VALUE[lvl] }}>
          {value.toFixed(1)}
        </span>
        <span style={{ ...text.body, color: color.textSecondary }}>%</span>
      </span>
    </div>
  );
}

/** Inline WH/AH substat — '· GPU Util WH 55.2 %' (node 7104:13992 Frame 10; gaps 6/3 per Frame 9 / Frame 2615571). */
function SubStat({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: space.sm }}>
      <span style={{ ...text.body, color: color.textTertiary }}>· {label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ ...text.body, color: color.textTitle }}>{value.toFixed(1)}</span>
        <span style={{ ...text.body, color: color.textSecondary }}>%</span>
      </span>
    </span>
  );
}

function UtilizationCard({ kpi }: { kpi: KpiByTask }) {
  const kind = taskKind(kpi.task);
  const caption =
    kind === 'training'
      ? '시간대와 무관하게 연속 수행되므로, 24시간 전체 기준으로 집계'
      : '시간대별 사용 편차가 크므로, 근무(09~18시), 비근무를 구분하여 집계';
  return (
    <Card
      padding={20}
      title={<TaskCardTitle kind={kind} caption={caption} />}
      headerStyle={TASK_HEADER_STYLE}
    >
      <div style={{ display: 'flex', gap: space.xxl, alignItems: 'stretch' }}>
        {/* Left: GPUs (accent, 28px) over Projects (muted, 24px) on a #FAFBFC panel (node 46368/46419) */}
        <div
          style={{
            flex: '0 0 auto',
            width: 144,
            background: '#FAFBFC',
            borderRadius: radius.sm,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 28, // Figma block spacing (재검증: 16px@1x wider than space.xl)
            padding: `${space.lg}px ${space.xl}px`,
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ ...text.metricXl, color: TASK_ACCENT[kind].metric }}>
              {num(gpuCountByTask[kpi.task] ?? 0)}
            </div>
            <div style={{ ...text.label, color: color.textMuted, marginTop: 4 }}>GPUs</div>
          </div>
          <div>
            <div style={{ ...text.metricLg, fontWeight: 500, color: color.textMuted }}>
              {num(kpi.project_count)}
            </div>
            <div style={{ ...text.label, color: color.textMuted, marginTop: 2 }}>Projects</div>
          </div>
        </div>
        {/* Right (v2): two fixed 95px rows (GPU Util / Slot Util) split by a 1px #E4E9ED divider;
            inference overlays the right-aligned WH/AH substat INSIDE the GPU Util row, above
            the divider (node 7104:13985 — substat band y=302-321, divider y=336 @2x). */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 190 }}>
          <div
            style={{
              position: 'relative',
              height: 95,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${color.border}`,
            }}
          >
            <div style={{ width: '100%' }}>
              <UtilRow label={GPU_UTIL.label} value={kpiVal(kpi, GPU_UTIL.key)} metric={GPU_UTIL.metric} task={kpi.task} />
            </div>
            {kind === 'inference' && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 2, // glyph-bottom→divider ≈ 7-8px@2x per Figma (re-verified)
                  display: 'flex',
                  gap: space.lg,
                }}
              >
                <SubStat label={GPU_UTIL_WH.label} value={kpiVal(kpi, GPU_UTIL_WH.key)} />
                <SubStat label={GPU_UTIL_AH.label} value={kpiVal(kpi, GPU_UTIL_AH.key)} />
              </div>
            )}
          </div>
          <div style={{ height: 95, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <UtilRow label={SLOT_UTIL.label} value={kpiVal(kpi, SLOT_UTIL.key)} metric={SLOT_UTIL.metric} task={kpi.task} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* §2 — GPU 보유현황                                                    */
/* ------------------------------------------------------------------ */

function HoldingsSection() {
  const { envRows, modelAggregates, total } = useMemo(() => {
    // Stable model ordering by first appearance.
    const models: string[] = [];
    for (const q of quotaByEnvGpu) {
      if (!models.includes(q.gpu_model)) models.push(q.gpu_model);
    }
    const modelColor: Record<string, string> = {};
    models.forEach((m, i) => {
      modelColor[m] = chart.categorical[i % chart.categorical.length];
    });

    // Group by environment -> one StackedBar row.
    const envOrder: string[] = [];
    const byEnv: Record<string, Record<string, number>> = {};
    for (const q of quotaByEnvGpu) {
      if (!byEnv[q.environment]) {
        byEnv[q.environment] = {};
        envOrder.push(q.environment);
      }
      byEnv[q.environment][q.gpu_model] =
        (byEnv[q.environment][q.gpu_model] ?? 0) + q.gpu_count;
    }

    // Per-model aggregate counts (also yields grand total).
    const counts: Record<string, number> = {};
    for (const q of quotaByEnvGpu) {
      counts[q.gpu_model] = (counts[q.gpu_model] ?? 0) + q.gpu_count;
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0);

    const envRows = envOrder.map((env) => {
      const rowTotal = Object.values(byEnv[env]).reduce((s, n) => s + n, 0);
      const share = total > 0 ? (rowTotal / total) * 100 : 0;
      return {
        label: env,
        rowTotal,
        share,
        segments: models
          .filter((m) => byEnv[env][m])
          .map((m) => ({ key: m, value: byEnv[env][m], color: modelColor[m] })),
      };
    });
    const modelAggregates = models.map((m) => ({
      model: m,
      color: modelColor[m],
      count: counts[m] ?? 0,
      share: total > 0 ? ((counts[m] ?? 0) / total) * 100 : 0,
    }));

    return { envRows, modelAggregates, total };
  }, []);

  const legendItems = modelAggregates.map((m) => ({
    label: m.model,
    color: m.color,
  }));

  return (
    <Card padding={space.xxl} style={{ boxShadow: 'none' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 302px',
          gap: space.xxl,
          alignItems: 'start',
        }}
      >
        {/* Left: 'GPU 분포' label left, legend right-aligned to the bar edge (node 7104:14440) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...text.bodyM, color: color.textMuted }}>
              GPU 분포
            </span>
            <Legend items={legendItems} size={12} />
          </div>
          {/* Trailing 6px after the last bar keeps the Figma 26px card-bottom spacing. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.xxl, paddingBottom: space.sm }}>
            {envRows.map((row) => (
              <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: color.textTitle }}>
                    {row.label}
                  </span>
                  {/* v2 (node 7104:14464): '736 장' #3C444B | 1×12 #90969D divider | '전체 대비 25.2%' #767D84 */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.md }}>
                    <span style={{ ...text.bodyM, color: color.textTitle }}>{num(row.rowTotal)} 장</span>
                    <span style={{ width: 1, height: 12, background: color.textMuted }} />
                    <span style={{ ...text.bodyM, color: color.textTertiary }}>
                      전체 대비 {row.share.toFixed(1)}%
                    </span>
                  </span>
                </div>
                {/* v2: full-width percentage bar (no absolute-magnitude track remainder) */}
                <StackedBar segments={row.segments} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: #FAFBFC total panel (v2 node 7104:14390; hairline #F2F6F9 outline, 20px pad,
            full-bleed divider, heading→rows gap 8, rows gap 6 per 7104:14394) */}
        <div
          style={{
            background: '#FAFBFC',
            borderRadius: radius.sm,
            border: '1px solid #F2F6F9',
            padding: space.xxl,
            display: 'flex',
            flexDirection: 'column',
            gap: space.lg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: color.textMuted }}>
              전체 GPU
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: space.xs }}>
              <span style={{ ...text.metricTotal, color: color.textSecondary }}>{num(total)}</span>
              <span style={{ ...text.bodyM, color: color.textMuted }}>장</span>
            </span>
          </div>
          <div style={{ height: 1, background: color.border, margin: '0 -20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: color.textMuted }}>
              모델별 합계
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
              {modelAggregates.map((m) => (
                // Figma Frame 85 (262×20, gap 4): legend 100 + pct 66 + count 88, numbers right-aligned
                <div key={m.model} style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
                  <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: space.sm, minWidth: 0 }}>
                    <span
                      style={{ width: 12, height: 12, borderRadius: 1, background: m.color, flexShrink: 0 }}
                    />
                    {/* v2 (7104:14400/14401): name #767D84 500/14, percent #565E66 400/14 */}
                    <span style={{ ...text.bodyM, color: color.textTertiary }}>{m.model}</span>
                  </span>
                  <span style={{ ...text.body, color: color.textSecondary, width: 66, textAlign: 'right', flexShrink: 0 }}>
                    {pct(m.share)}
                  </span>
                  <span
                    style={{
                      ...text.bodyM,
                      fontWeight: 500,
                      color: color.textSecondary,
                      width: 88,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {num(m.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* §3 — GPU 활용도 점유                                                 */
/* ------------------------------------------------------------------ */

const SELECTED = tokenScreen.selected;

/**
 * Badge level per the STATED rank-table criteria — thresholds come from
 * GRADE_POLICY[task].badge (운영 정책과 함께 변경됨).
 */
const rankLevel = (task: TaskType, value: number, metric: 'gpu' | 'slot') => {
  const b = GRADE_POLICY[task].badge[metric];
  return value >= b.good ? 'good' : value <= b.bad ? 'bad' : 'warn';
};

/** Rank-table util chip (same 60×22 'lg' chip styles as UtilBadge, colors from rankLevel). */
function RankUtilBadge({ task, value, metric }: { task: TaskType; value: number; metric: 'gpu' | 'slot' }) {
  const lvl = rankLevel(task, value, metric);
  const c = semantic.util[lvl];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'top',
        minWidth: 60,
        padding: '2px 10px',
        borderRadius: radius.cell,
        // lg 'bad' uses the lighter #FFE3E1 sampled on the v2 Overview badges.
        background: lvl === 'bad' ? '#FFE3E1' : c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 12,
        lineHeight: '16px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {value.toFixed(1)}%
    </span>
  );
}

/**
 * v2 rank columns: one merged '과제' column (22×22 rank box + name + trailing
 * 90px division), criteria-colored util badges, '장 수(H100기준)'.
 * Expanded (selected) rows flip to the blue palette (#E6F1FA box / #0077C8 text).
 */
const rankColumnsFor = (task: TaskType): DataTableColumn<RankedProject>[] => [
  {
    key: 'project',
    header: '과제',
    render: (r, i, expanded) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: space.md, minWidth: 0 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: radius.cell,
            background: expanded ? SELECTED.badgeBg : '#F2F6F9',
            fontSize: 11,
            lineHeight: '13px',
            fontWeight: 400,
            color: expanded ? SELECTED.meta : color.textSecondary,
            flexShrink: 0,
          }}
        >
          {i + 1}
        </span>
        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: space.md, minWidth: 0 }}>
          <span
            style={{
              ...text.bodyM,
              color: expanded ? SELECTED.text : color.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {r.project_name}
          </span>
        </span>
        <span style={{ ...text.body, color: expanded ? SELECTED.text : color.textSecondary, flex: '0 0 90px' }}>
          {r.division}
        </span>
      </span>
    ),
  },
  {
    key: 'gpu_ut',
    header: GPU_UTIL.label,
    align: 'center',
    width: 110, // Figma column packing: 과제 452 + 3×~106-110 (재검증)
    render: (r) => <RankUtilBadge task={task} value={r.gpu_ut} metric="gpu" />,
  },
  {
    key: 'slot_ut',
    header: SLOT_UTIL.label,
    align: 'center',
    width: 110,
    render: (r) => <RankUtilBadge task={task} value={r.slot_ut} metric="slot" />,
  },
  {
    key: 'quota',
    header: '장 수',
    align: 'center',
    width: 120,
    render: (r, _i, expanded) => (
      <span style={{ ...text.body, color: expanded ? SELECTED.text : color.textSecondary }}>
        {num(r.quota)}
      </span>
    ),
  },
];

/** Single-line rank-table heading: title + neutral 'N 건' count + inline threshold caption. */
function RankTitle({ title, count, caption }: { title: string; count: number; caption: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: space.lg }}>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: space.xs }}>
        <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 500, color: color.textTitle }}>
          {title}
        </span>
        <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 500, color: color.textTitle }}>
          {count}
        </span>
        <span style={{ ...text.body, color: color.textTitle }}>건</span>
      </span>
      <span style={{ ...text.caption, color: color.textTertiary }}>{caption}</span>
    </div>
  );
}

/**
 * ~5-row scroll viewport (5×49 + 30px header ≈ 275px) that RELEASES its
 * maxHeight while any row is expanded, so the expanded detail is fully
 * visible without fighting an inner scrollbar.
 */
function RankTableScroller({
  children,
}: {
  children: (onExpandChange: (anyExpanded: boolean) => void) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={expanded ? undefined : { maxHeight: 275, overflowY: 'auto' }}>
      {children(setExpanded)}
    </div>
  );
}

/** Token-screen 더보기-style ghost row linking to the 활용 현황 grade filter. */
function ShowAllRow({ count, onClick }: { count: number; onClick?: () => void }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      className="gd-clickable"
      onClick={onClick}
      style={{
        width: '100%',
        height: 36,
        border: 'none',
        borderTop: '1px solid #EFF4F8',
        background: 'transparent',
        cursor: 'pointer',
        ...text.caption,
        color: color.textSecondary,
        fontFamily: 'inherit',
      }}
    >
      전체 {num(count)}건 보기 →
    </button>
  );
}

const RANK_PREVIEW = 10;

function OccupancyColumn({
  task,
  onShowAll,
  rank,
  projectCount,
  filters,
}: {
  task: TaskType;
  onShowAll?: ShowAllHandler;
  rank: import('../mock/data').TaskRank;
  projectCount: number;
  filters: GlobalFilters;
}) {
  const kind = taskKind(task);
  const rankColumns = useMemo(() => rankColumnsFor(task), [task]);
  const expandRow = (showReclaim: boolean) => (r: RankedProject) => (
    <ExpandedTaskDetail
      data={getProjectUnits(r.project_id, task, filters)}
      taskType={task}
      isStrategic={r.is_critical === 'Y'}
      bg="#F2F6F9"
      dense
      showReclaim={showReclaim}
    />
  );
  const rankTable = (
    rows: RankedProject[],
    prefix: string,
    first = false,
    showReclaim = false,
  ) => (
    <RankTableScroller>
      {(onExpandChange) => (
        <DataTable
          columns={rankColumns}
          rows={rows}
          rowKey={(r) => `${prefix}-${r.project_id}`}
          vPad={13}
          // 재검증: no line under the header band; table-top border on the FIRST table only.
          headBorderBottom={false}
          headBorderTop={first}
          expandedContent={expandRow(showReclaim)}
          rowStyle={(_r, _i, expanded) => (expanded ? { background: SELECTED.rowBg } : undefined)}
          panelStyle={{ padding: 0, background: '#F2F6F9' }}
          onExpandChange={onExpandChange}
        />
      )}
    </RankTableScroller>
  );

  return (
    <Card
      padding={space.xxl}
      title={<TaskCardTitle kind={kind} />}
      headerStyle={TASK_HEADER_STYLE}
      headerRight={
        /* v2 export ground truth: all-gray #565E66 — '32' 500/16 + ' Projects' 400/16 */
        <span style={{ fontSize: 16, lineHeight: '20px', color: color.textSecondary }}>
          <span style={{ fontWeight: 500 }}>{num(projectCount)}</span>
          <span style={{ fontWeight: 400 }}> Projects</span>
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <RankTitle
            title="우수 활용 과제"
            count={rank.good_count}
            caption={goodLabel(task)}
          />
          {rankTable(rank.good.slice(0, RANK_PREVIEW), 'good', true, false)}
          <ShowAllRow
            count={rank.good_count}
            onClick={
              onShowAll && rank.good_count > RANK_PREVIEW
                ? () => onShowAll(task, '우수')
                : undefined
            }
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
          <RankTitle
            title="저활용 과제"
            count={rank.alert_count}
            caption={reclaimLabel(task)}
          />
          {rankTable(rank.alert.slice(0, RANK_PREVIEW), 'alert', false, true)}
          <ShowAllRow
            count={rank.alert_count}
            onClick={
              onShowAll && rank.alert_count > RANK_PREVIEW
                ? () => onShowAll(task, '저활용')
                : undefined
            }
          />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* §4 — GPU 사용추이                                                    */
/* ------------------------------------------------------------------ */

// Figma themes each trend card to one hue, distinguishing the two series by
// solid (GPU Util) vs dashed (Slot Util): Inference all-cyan #00B3E2 (nodes 47284/47288),
// Training all-purple #8092DC (nodes 47364/47368).
const trendColor = (kind: 'inference' | 'training') => (kind === 'training' ? '#8092DC' : '#00B3E2');
// v2 hover (active) dots darken: inference #0093BA, training #6978B8 (nodes 7104:14216/14339).
const trendActiveColor = (kind: 'inference' | 'training') =>
  kind === 'training' ? '#6978B8' : '#0093BA';

const trendSeriesFor = (kind: 'inference' | 'training'): TrendSeries[] => {
  const c = trendColor(kind);
  const active = trendActiveColor(kind);
  return [
    { key: 'gpu_ut', label: GPU_UTIL.label, color: c, activeColor: active },
    { key: 'slot_ut', label: SLOT_UTIL.label, color: c, dash: true, activeColor: active },
  ];
};

/** Trend-card legend: solid-bar marker for GPU Util, dotted-line marker for Slot Util. */
function TrendLegend({ color: c }: { color: string }) {
  const dot = <span style={{ width: 3, height: 3, background: c }} />;
  const item = (label: string, dashed: boolean) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm }}>
      <span style={{ display: 'inline-flex', width: 13, justifyContent: 'space-between' }}>
        {dashed ? (
          <>
            {dot}
            {dot}
            {dot}
          </>
        ) : (
          <span style={{ width: 13, height: 3, background: c }} />
        )}
      </span>
      <span style={{ fontSize: 12, lineHeight: '14px', fontWeight: 500, color: color.textSecondary }}>
        {label}
      </span>
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.lg }}>
      {item(GPU_UTIL.label, false)}
      {item(SLOT_UTIL.label, true)}
    </span>
  );
}

function TrendSection({ trend }: { trend: Record<TaskType, import('../mock/types').UtilTrendPoint[]> }) {
  const renderCard = (task: TaskType) => {
    const kind = taskKind(task);
    const accent = TASK_ACCENT[kind].metric;
    const series = trendSeriesFor(kind);
    const pts = trend[task];
    const data = pts.map((p) => ({ ts: p.ts, gpu_ut: p.gpu_ut, slot_ut: p.slot_ut }));
    return (
      <Card title={<TaskCardTitle kind={kind} />} headerStyle={TASK_HEADER_STYLE}>
        {/* v2: legend leaves the header and joins the 평균 stats row in the card body */}
        <div
          style={{
            marginBottom: space.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.xl,
          }}
        >
          {/* Frame 10/9/2615571 gaps: 12 between stats, 6 label→value, 3 value→'%' */}
          <div style={{ display: 'flex', gap: space.lg }}>
            {([
              ['GPU 평균', 'gpu_ut'],
              ['Slot 평균', 'slot_ut'],
            ] as const).map(([lbl, key]) => (
              <span key={key} style={{ display: 'inline-flex', alignItems: 'baseline', gap: space.sm }}>
                <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400, color: color.textTertiary }}>
                  {lbl}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 500, color: accent }}>
                    {trendAvg(pts, key).toFixed(1)}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400, color: color.textSecondary }}>
                    %
                  </span>
                </span>
              </span>
            ))}
          </div>
          <TrendLegend color={trendColor(kind)} />
        </div>
        <TrendChart data={data} xKey="ts" series={series} height={238} area={false} />
      </Card>
    );
  };

  return (
    <TwoCol>
      {renderCard('추론')}
      {renderCard('학습')}
    </TwoCol>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export interface ShowAllHandler {
  (task: TaskType, grade: '우수' | '저활용'): void;
}

export default function OverviewPage({
  onShowAll,
  filters,
}: {
  onShowAll?: ShowAllHandler;
  filters: GlobalFilters;
}) {
  // Every section derives from the SAME filtered window (기간/사업부/과제 구분).
  const kpis = useMemo(() => getKpiByTask(filters), [filters]);
  const rank = useMemo(() => getRankByTask(filters), [filters]);
  const trend = useMemo(() => getUtilTrend(filters), [filters]);
  const inference = kpis.find((k) => k.task === '추론') ?? kpis[0];
  const training = kpis.find((k) => k.task === '학습') ?? kpis[1];

  return (
    <div>
      <Section id="sec-util" title="GPU 활용현황" caption="추론 · 학습별 핵심 모니터링 지표">
        <TwoCol>
          <UtilizationCard kpi={inference} />
          <UtilizationCard kpi={training} />
        </TwoCol>
      </Section>

      <Section id="sec-holdings" title="GPU 보유현황" caption="환경별 x 모델별 보유 장수" defaultCollapsed>
        <HoldingsSection />
      </Section>

      <Section id="sec-occupancy" title="GPU 활용도 점검" caption="우수 저활용 과제 순위">
        <TwoCol>
          <OccupancyColumn task="추론" onShowAll={onShowAll} rank={rank['추론']} projectCount={inference.project_count} filters={filters} />
          <OccupancyColumn task="학습" onShowAll={onShowAll} rank={rank['학습']} projectCount={training.project_count} filters={filters} />
        </TwoCol>
      </Section>

      <Section id="sec-trend" title="GPU 사용추이" caption={`${filters.period} · 추론/학습별 Slot Util · GPU Util`}>
        <TrendSection trend={trend} />
      </Section>
    </div>
  );
}
