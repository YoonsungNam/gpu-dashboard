import { useMemo } from 'react';
import { chart, color, radius, space, text } from '../tokens';
import { num, pct, utilLevel } from '../lib/util';
import { UTIL_METRICS, GPU_UTIL, SLOT_UTIL } from '../lib/labels';

import SectionHeader from '../components/primitives/SectionHeader';
import Card from '../components/primitives/Card';
import ProgressBar from '../components/primitives/ProgressBar';
import UtilBadge from '../components/primitives/UtilBadge';
import Legend from '../components/primitives/Legend';
import DataTable, { type DataTableColumn } from '../components/primitives/DataTable';
import { TaskIcon } from '../icons/FigureIcons';

import StackedBar from '../components/charts/StackedBar';
import TrendChart, { type TrendSeries } from '../components/charts/TrendChart';
import ExpandedTaskDetail from '../components/compositions/ExpandedTaskDetail';

import type { KpiByTask, RankedProject, TaskType } from '../mock/types';
import {
  getProjectUnits,
  gpuCountByTask,
  kpiByTask,
  quotaByEnvGpu,
  topBottomProjects,
  trendAvg,
  utilTrendByTask,
} from '../mock/data';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Map a Korean task label to the task-card accent kind. */
const taskKind = (task: TaskType): 'inference' | 'training' =>
  task === '학습' ? 'training' : 'inference';

/**
 * Per-task card accent — exact fills from Figma task-card headers
 * (header bg #F3FBFD/#F7F8FD, bottom border #E6F7FC/#F2F4FC, title #007492/#5A49A6).
 */
const TASK_ACCENT = {
  inference: { title: '#007492', headerBg: '#F3FBFD', headerBorder: '#E6F7FC' },
  training: { title: '#5A49A6', headerBg: '#F7F8FD', headerBorder: '#F2F4FC' },
} as const;

/** Card title: real 20px task icon + colored "Inference / 추론" text (+ optional caption). */
function TaskCardTitle({ kind, caption }: { kind: 'inference' | 'training'; caption?: string }) {
  const title = kind === 'training' ? 'Training / 학습' : 'Inference / 추론';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <TaskIcon kind={kind} size={20} />
      <span style={{ ...text.cardTitle, color: TASK_ACCENT[kind].title }}>{title}</span>
      {caption && (
        <span style={{ ...text.caption, color: color.textTitle, marginLeft: space.xs }}>{caption}</span>
      )}
    </span>
  );
}

/** Tinted header style for a task card — pass to <Card headerStyle>. */
const taskHeaderStyle = (kind: 'inference' | 'training') => ({
  background: TASK_ACCENT[kind].headerBg,
  borderBottomColor: TASK_ACCENT[kind].headerBorder,
});

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

/** Section wrapper: SectionHeader + content, with vertical rhythm. */
function Section({
  id,
  title,
  caption,
  children,
}: {
  id?: string;
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: space.xxl + space.lg }}>
      <SectionHeader title={title} caption={caption} />
      {children}
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
}: {
  label: string;
  value: number;
  metric: 'gpu' | 'slot';
}) {
  const lvl = utilLevel(value, metric);
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

function UtilizationCard({ kpi }: { kpi: KpiByTask }) {
  const kind = taskKind(kpi.task);
  const accent = TASK_ACCENT[kind].title;
  const caption =
    kind === 'training'
      ? '시간대와 무관하게 연속 수행되므로, 24시간 전체 기준으로 집계'
      : '시간대별 사용 편차가 크므로, 근무(09~18시), 비근무를 구분하여 집계';
  return (
    <Card title={<TaskCardTitle kind={kind} caption={caption} />} headerStyle={taskHeaderStyle(kind)}>
      <div style={{ display: 'flex', gap: space.xxl, alignItems: 'center' }}>
        {/* Left: GPUs (accent, 28px) over Projects (muted, 24px) */}
        <div
          style={{
            flex: '0 0 auto',
            minWidth: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: space.lg,
          }}
        >
          <div>
            <div style={{ ...text.metricXl, color: accent }}>
              {num(gpuCountByTask[kpi.task] ?? 0)}
            </div>
            <div style={{ ...text.label, color: color.textMuted, marginTop: 2 }}>GPUs</div>
          </div>
          <div>
            <div style={{ ...text.metricLg, fontWeight: 500, color: color.textMuted }}>
              {num(kpi.project_count)}
            </div>
            <div style={{ ...text.label, color: color.textMuted, marginTop: 2 }}>Projects</div>
          </div>
        </div>
        {/* Right: util rows */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: space.lg,
          }}
        >
          {UTIL_METRICS.map((def) => (
            <UtilRow
              key={def.key}
              label={def.label}
              value={kpiVal(kpi, def.key)}
              metric={def.metric}
            />
          ))}
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
        annotation: `${num(rowTotal)} 장 | 전체 대비 ${share.toFixed(1)}%`,
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
    <Card>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 260px',
          gap: space.xxl,
          alignItems: 'start',
        }}
      >
        {/* Left: legend + stacked bars (each with a right-aligned annotation) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
            <span style={{ ...text.label, color: color.textMuted }}>GPU 분포</span>
            <Legend items={legendItems} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
            {envRows.map((row) => (
              <div
                key={row.label}
                style={{ display: 'flex', alignItems: 'center', gap: space.lg }}
              >
                <div style={{ flex: 1 }}>
                  <StackedBar rows={[row]} showValues />
                </div>
                <span
                  style={{
                    ...text.caption,
                    color: color.textTertiary,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    textAlign: 'right',
                  }}
                >
                  {row.annotation}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: total + per-model list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: space.lg,
            borderLeft: `1px solid ${color.border}`,
            paddingLeft: space.xxl,
          }}
        >
          <div>
            <div style={{ ...text.label, color: color.textTertiary }}>GPU 전체</div>
            <div style={{ ...text.metricTotal, color: color.textPrimary }}>
              {num(total)} 장
            </div>
          </div>
          <div style={{ ...text.label, color: color.textMuted }}>모델별 합계</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
            {modelAggregates.map((m) => (
              <div
                key={m.model}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: space.sm,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: m.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    ...text.bodyM,
                    color: color.textSecondary,
                    flex: 1,
                  }}
                >
                  {m.model}
                </span>
                <span style={{ ...text.caption, color: color.textTertiary }}>
                  {pct(m.share)}
                </span>
                <span
                  style={{
                    ...text.bodyM,
                    fontWeight: 600,
                    color: color.textPrimary,
                    width: 48,
                    textAlign: 'right',
                  }}
                >
                  {num(m.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* §3 — GPU 활용도 점유                                                 */
/* ------------------------------------------------------------------ */

function makeRankColumns(boxed = false): DataTableColumn<RankedProject>[] {
  return [
    {
      key: 'rank',
      header: '#',
      width: 36,
      align: 'center',
      // Figma 우수 table uses a neutral 22×22 #F2F6F9 r2 rank box (node 7001:46501);
      // the 저활용 table uses a plain number.
      render: (_r, i) =>
        boxed ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: radius.cell,
              background: '#F2F6F9',
              ...text.numTiny,
              color: color.textSecondary,
            }}
          >
            {i + 1}
          </span>
        ) : (
          <span style={{ ...text.numTiny, color: color.textTertiary }}>{i + 1}</span>
        ),
    },
    {
      key: 'project_name',
      header: '과제명',
      render: (r) => (
        <span style={{ ...text.bodyM, color: color.textPrimary }}>
          {r.project_name}
        </span>
      ),
    },
    {
      key: 'division',
      header: '구분',
      render: (r) => (
        <span style={{ ...text.bodyM, color: color.textSecondary }}>
          {r.division}
        </span>
      ),
    },
    {
      key: 'gpu_ut',
      header: GPU_UTIL.label,
      align: 'center',
      render: (r) => <UtilBadge value={r.gpu_ut} metric={GPU_UTIL.metric} />,
    },
    {
      key: 'slot_ut',
      header: SLOT_UTIL.label,
      align: 'center',
      render: (r) => <UtilBadge value={r.slot_ut} metric={SLOT_UTIL.metric} />,
    },
    {
      key: 'quota',
      header: '장 수',
      align: 'right',
      render: (r) => (
        <span style={{ ...text.bodyM, color: color.textPrimary }}>
          {num(r.quota)}
        </span>
      ),
    },
  ];
}

/** Small title (+ inline 건 count) and threshold subtitle above a rank table. */
function RankTitle({ title, count, subtitle }: { title: string; count: number; subtitle: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xxs }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm }}>
        <span style={{ ...text.bodyM, fontWeight: 600, color: color.textPrimary }}>{title}</span>
        <span style={{ ...text.label, fontWeight: 600, color: color.brand }}>{count}건</span>
        <span style={{ ...text.caption, color: color.textTertiary }}>| H100 기준</span>
      </div>
      <div style={{ ...text.caption, color: color.textTertiary }}>{subtitle}</div>
    </div>
  );
}

function OccupancyColumn({ task }: { task: TaskType }) {
  const kind = taskKind(task);
  const boxedCols = useMemo(() => makeRankColumns(true), []);
  const plainCols = useMemo(() => makeRankColumns(false), []);
  const projectCount = kpiByTask.find((k) => k.task === task)?.project_count ?? 0;

  return (
    <Card
      title={<TaskCardTitle kind={kind} />}
      headerStyle={taskHeaderStyle(kind)}
      headerRight={
        <span style={{ ...text.cardTitle, fontWeight: 500, color: TASK_ACCENT[kind].title }}>
          {num(projectCount)} Projects
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <RankTitle
            title="우수 활용 과제"
            count={topBottomProjects.good.length}
            subtitle="GPU Util ≥ 66%"
          />
          {/* Expandable rows reproduce the Overview(2) expanded state. */}
          <DataTable
            columns={boxedCols}
            rows={topBottomProjects.good}
            rowKey={(r) => `good-${r.project_id}`}
            compact
            expandedContent={(r) => (
              <ExpandedTaskDetail
                data={getProjectUnits(r.project_id)}
                isCritical={r.is_critical === 'Y'}
                tasks={[task]}
              />
            )}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <RankTitle
            title="저활용 과제"
            count={topBottomProjects.alert.length}
            subtitle="모델학습: GPU Util ≤ 30% & Slot Util ≤ 75% · 모델개발: GPU Util ≤ 5% & Slot Util ≤ 75%"
          />
          <DataTable
            columns={plainCols}
            rows={topBottomProjects.alert}
            rowKey={(r) => `alert-${r.project_id}`}
            compact
          />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* §4 — GPU 사용추이                                                    */
/* ------------------------------------------------------------------ */

const trendSeries: TrendSeries[] = [
  { key: 'gpu_ut', label: GPU_UTIL.label, color: chart.series.primary },
  { key: 'slot_ut', label: SLOT_UTIL.label, color: chart.series.secondary, dash: true },
];

function TrendSection() {
  const legendItems = trendSeries.map((s) => ({ label: s.label, color: s.color }));

  const renderCard = (task: TaskType) => {
    const kind = taskKind(task);
    const pts = utilTrendByTask[task];
    const data = pts.map((p) => ({ ts: p.ts, gpu_ut: p.gpu_ut, slot_ut: p.slot_ut }));
    return (
      <Card
        title={<TaskCardTitle kind={kind} />}
        headerStyle={taskHeaderStyle(kind)}
        headerRight={<Legend items={legendItems} />}
      >
        <div
          style={{
            ...text.bodyM,
            fontWeight: 600,
            color: color.textSecondary,
            marginBottom: space.md,
            display: 'flex',
            gap: space.xl,
          }}
        >
          <span>
            GPU 평균 <span style={{ color: color.brand }}>{trendAvg(pts, 'gpu_ut')}%</span>
          </span>
          <span>
            Slot 평균 <span style={{ color: color.brand }}>{trendAvg(pts, 'slot_ut')}%</span>
          </span>
        </div>
        <TrendChart data={data} xKey="ts" series={trendSeries} height={180} area />
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

export default function OverviewPage() {
  const inference = kpiByTask.find((k) => k.task === '추론') ?? kpiByTask[0];
  const training = kpiByTask.find((k) => k.task === '학습') ?? kpiByTask[1];

  return (
    <div>
      <Section id="sec-util" title="GPU 활용현황" caption="추론 · 학습별 핵심 모니터링 지표">
        <TwoCol>
          <UtilizationCard kpi={inference} />
          <UtilizationCard kpi={training} />
        </TwoCol>
      </Section>

      <Section id="sec-holdings" title="GPU 보유현황" caption="환경별 x 모델별 보유 장수">
        <HoldingsSection />
      </Section>

      <Section id="sec-occupancy" title="GPU 활용도 점검" caption="우수 저활용 과제 순위">
        <TwoCol>
          <OccupancyColumn task="추론" />
          <OccupancyColumn task="학습" />
        </TwoCol>
      </Section>

      <Section id="sec-trend" title="GPU 사용추이" caption="최근 30일 · 추론/학습별 Slot Util · GPU Util">
        <TrendSection />
      </Section>
    </div>
  );
}
