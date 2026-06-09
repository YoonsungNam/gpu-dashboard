import { color, radius, space, text } from '../../tokens';
import { num, pct, utilColors } from '../../lib/util';
import { UTIL_METRICS } from '../../lib/labels';
import type { ProjectUnit, ProjectUnitInfo, ProjectUnitsResponse, TaskType } from '../../mock/types';
import DataTable, { type DataTableColumn } from '../primitives/DataTable';
import UtilBadge from '../primitives/UtilBadge';
import ProgressBar from '../primitives/ProgressBar';
import TaskTypeBadge, { kindOf } from '../primitives/TaskTypeBadge';

/** Reads a (possibly optional) utilization field off info/unit, defaulting to 0. */
function utilOf(obj: ProjectUnitInfo | ProjectUnit, key: string): number {
  return (obj as unknown as Record<string, number | undefined>)[key] ?? 0;
}

/**
 * Shared inline expanded-row detail used by both the Overview and GPU 자원
 * screens. Renders the 활용 지표 strip (lead tile + 4 metrics with progress
 * bars) plus the UNIT 구성 sub-table. Pure presentational.
 */
export default function ExpandedTaskDetail({
  data,
  isCritical,
  tasks,
  leadCount,
}: {
  data: ProjectUnitsResponse;
  isCritical?: boolean;
  tasks?: TaskType[];
  leadCount?: number;
}) {
  const { info, units } = data;
  const lead = leadCount ?? units.reduce((sum, u) => sum + u.gpu_num, 0);

  const columns: DataTableColumn<ProjectUnit>[] = [
    { key: 'unit_name', header: 'Unit', render: (u) => u.unit_name },
    { key: 'gpu_model', header: '모델', render: (u) => u.gpu_model },
    { key: 'gpu_num', header: '수량(H100기준)', align: 'right', render: (u) => u.gpu_num },
    ...UTIL_METRICS.map((def): DataTableColumn<ProjectUnit> => ({
      key: def.key,
      header: def.label,
      render: (u) => <UtilBadge value={utilOf(u, def.key)} metric={def.metric} />,
    })),
  ];

  return (
    <div
      style={{
        background: color.cardBgAlt,
        padding: space.xl,
        borderRadius: radius.card,
        display: 'flex',
        flexDirection: 'column',
        gap: space.xl,
      }}
    >
      {/* Header: 활용 지표 + badge cluster */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.md,
        }}
      >
        <span style={{ ...text.cardTitle }}>활용 지표</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
          {isCritical && <TaskTypeBadge kind="core" />}
          {tasks?.map((t, i) => (
            <TaskTypeBadge key={`${t}-${i}`} kind={kindOf(t)} />
          ))}
        </div>
      </div>

      {/* Lead tile + 4 metrics inside a SINGLE card with vertical dividers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: color.cardBg,
          border: `1px solid ${color.border}`,
          borderRadius: radius.card,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: space.xs,
            justifyContent: 'center',
            padding: space.lg,
            minWidth: 124,
          }}
        >
          <span style={{ ...text.metricLg }}>{num(lead)} 장</span>
          <span style={{ ...text.caption, color: color.textTertiary }}>수량(H100기준)</span>
        </div>
        {UTIL_METRICS.map((def) => {
          const value = utilOf(info, def.key);
          return (
            <div
              key={def.key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: space.sm,
                padding: space.lg,
                borderLeft: `1px solid ${color.border}`,
              }}
            >
              <span style={{ ...text.label, color: color.textSecondary }}>{def.label}</span>
              <span style={{ ...text.metricLg, color: utilColors(value, def.metric).text }}>
                {pct(value)}
              </span>
              <ProgressBar value={value} />
            </div>
          );
        })}
      </div>

      {/* UNIT 구성 sub-table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <div style={{ ...text.bodyM, fontWeight: 600, marginTop: space.xl }}>UNIT 구성</div>
        <DataTable columns={columns} rows={units} rowKey={(u) => u.unit_id} compact />
      </div>
    </div>
  );
}
