import { useMemo, useState } from 'react';
import { color, radius, semantic, space, text } from '../tokens';
import { num } from '../lib/util';
import { UTIL_METRICS } from '../lib/labels';
import type { ProjectRow, TaskType } from '../mock/types';
import Card from '../components/primitives/Card';
import DataTable, { type DataTableColumn } from '../components/primitives/DataTable';
import Tabs from '../components/primitives/Tabs';
import SearchInput from '../components/primitives/SearchInput';
import Pagination from '../components/primitives/Pagination';
import DownloadButton from '../components/primitives/DownloadButton';
import UtilBadge from '../components/primitives/UtilBadge';
import TaskTypeBadge from '../components/primitives/TaskTypeBadge';
import ExpandedTaskDetail from '../components/compositions/ExpandedTaskDetail';
import { projects, getProjectUnits } from '../mock/data';

const PAGE_SIZE = 15;

type TabKey = TaskType; // '추론' | '학습'

/** Per-row value getter for the four util columns (key matches the inference_* fields). */
const UTIL_VALUE: Record<string, (r: ProjectRow) => number> = {
  gpu_ut: (r) => r.inference_gpu_ut,
  gpu_ut_working: (r) => r.inference_gpu_ut_working ?? 0,
  gpu_ut_nonworking: (r) => r.inference_gpu_ut_nonworking ?? 0,
  slot_ut: (r) => r.slot_ut,
};

/**
 * GPU 자원 page (design-spec §5.B). The Live pill + 기간/사업부/핵심 filters +
 * 지표 정의 link live in the app bar (see App.tsx); this page's own toolbar is
 * just Tabs + Search (left) and result-count + 다운로드 (right).
 */
export default function GpuResourcePage() {
  const [tab, setTab] = useState<TabKey>('추론'); // 추론 default, no 전체
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const onTab = (k: TabKey) => {
    setTab(k);
    setPage(1);
  };
  const onQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  // Client-side filtering: tab by member_tasks, search by project_name OR user_id.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!p.member_tasks.includes(tab)) return false;
      if (q && !p.project_name.toLowerCase().includes(q) && !p.user_id.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: DataTableColumn<ProjectRow>[] = [
    {
      key: 'index',
      header: '#',
      width: 36,
      align: 'right',
      render: (_r, i) => (
        <span style={{ ...text.numTiny, color: color.textTertiary }}>
          {(safePage - 1) * PAGE_SIZE + i + 1}
        </span>
      ),
    },
    {
      key: 'project_name',
      header: '과제',
      render: (r) => (
        <span style={{ ...text.bodyM, color: color.textPrimary }}>{r.project_name}</span>
      ),
    },
    {
      key: 'division',
      header: '사업부',
      render: (r) => <span style={{ color: color.textSecondary }}>{r.division}</span>,
    },
    {
      key: 'purpose',
      header: '용도',
      render: (r) => <span style={{ color: color.textSecondary }}>{r.purpose}</span>,
    },
    {
      key: 'is_critical',
      header: '핵심여부',
      align: 'center',
      render: (r) => (r.is_critical === 'Y' ? <TaskTypeBadge kind="core" /> : null),
    },
    {
      key: 'user_id',
      header: '담당자',
      render: (r) => <span style={{ color: color.textSecondary }}>{r.user_id}</span>,
    },
    {
      key: 'quota',
      header: '수량(H100기준)',
      align: 'right',
      render: (r) => (
        <span style={{ ...text.numTiny, color: color.textPrimary }}>{num(r.quota)}</span>
      ),
    },
    ...UTIL_METRICS.map((def): DataTableColumn<ProjectRow> => ({
      key: def.key,
      header: def.label,
      align: 'center',
      render: (r) => <UtilBadge value={UTIL_VALUE[def.key](r)} metric={def.metric} />,
    })),
  ];

  // Tab counts derived from the full project set.
  const inferenceCount = projects.filter((p) => p.member_tasks.includes('추론')).length;
  const trainingCount = projects.filter((p) => p.member_tasks.includes('학습')).length;
  const tabs = [
    { key: '추론', label: '추론', count: inferenceCount },
    { key: '학습', label: '학습', count: trainingCount },
  ];

  // Bottom legend: two metric-specific scales (good/warn/bad).
  const u = semantic.util;
  const gpuLegend = [
    { label: '≥20%', lvl: u.good },
    { label: '10–20%', lvl: u.warn },
    { label: '<10%', lvl: u.bad },
  ];
  const slotLegend = [
    { label: '≥80%', lvl: u.good },
    { label: '70–80%', lvl: u.warn },
    { label: '<70%', lvl: u.bad },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      {/* Page toolbar: Tabs + Search (left) · result count + 다운로드 (right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.xl,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
          <Tabs tabs={tabs} active={tab} onChange={(k) => onTab(k as TabKey)} />
          <SearchInput
            value={query}
            onChange={onQuery}
            placeholder="과제명 담당자 검색"
            width={220}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
          <span style={{ ...text.numTiny, color: color.textTertiary }}>
            {pageRows.length}/{filtered.length}
          </span>
          <DownloadButton />
        </div>
      </div>

      {/* Main expandable data table. */}
      <Card padding={0}>
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(r) => r.project_id}
          compact
          expandedContent={(r) => (
            <ExpandedTaskDetail
              data={getProjectUnits(r.project_id)}
              isCritical={r.is_critical === 'Y'}
              tasks={r.member_tasks}
            />
          )}
          emptyText="조건에 맞는 과제가 없습니다"
        />
      </Card>

      {/* Pagination (centered) + threshold legend pills (right). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: space.xl,
        }}
      >
        <div />
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: space.xs,
            alignItems: 'flex-end',
            justifySelf: 'end',
          }}
        >
          <LegendRow title="GPU Util" items={gpuLegend} />
          <LegendRow title="Slot Util" items={slotLegend} />
        </div>
      </div>
    </div>
  );
}

/** One labeled threshold scale as filled pill chips (e.g. "GPU Util  [≥20%][10–20%][<10%]"). */
function LegendRow({
  title,
  items,
}: {
  title: string;
  items: { label: string; lvl: { bg: string; border: string; text: string } }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
      <span style={{ ...text.label, color: color.textSecondary, minWidth: 56 }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
        {items.map((it) => (
          <span
            key={it.label}
            style={{
              padding: '2px 8px',
              borderRadius: radius.pill,
              background: it.lvl.bg,
              border: `1px solid ${it.lvl.border}`,
              color: it.lvl.text,
              ...text.tiny,
              fontWeight: 600,
            }}
          >
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
