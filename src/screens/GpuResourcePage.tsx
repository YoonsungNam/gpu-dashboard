import { useMemo, useState } from 'react';
import { color, radius, semantic, space, text } from '../tokens';
import { num } from '../lib/util';
import { GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL, type MetricDef } from '../lib/labels';
import type { ProjectRow, TaskType } from '../mock/types';
import Card from '../components/primitives/Card';
import DataTable, { type DataTableColumn } from '../components/primitives/DataTable';
import Tabs from '../components/primitives/Tabs';
import SearchInput from '../components/primitives/SearchInput';
import Pagination from '../components/primitives/Pagination';
import DownloadButton from '../components/primitives/DownloadButton';
import UtilBadge from '../components/primitives/UtilBadge';
import TaskTypeBadge from '../components/primitives/TaskTypeBadge';
import GradeBadge from '../components/primitives/GradeBadge';
import GradeFilter, { type GradeFilterValue } from '../components/compositions/GradeFilter';
import ExpandedTaskDetail from '../components/compositions/ExpandedTaskDetail';
import { projects, getProjectUnits } from '../mock/data';

const PAGE_SIZE = 15;

type TabKey = TaskType; // '추론' | '학습'

/** v2 selected-row text color (expanded rows tint #F0F7FC + #0077C8 text). */
const SELECTED_TEXT = '#0077C8';

/** Per-tab value getter for the util columns (학습 GPU Util is training-scoped). */
function utilValue(r: ProjectRow, key: string, tab: TabKey): number {
  switch (key) {
    case 'gpu_ut':
      return tab === '학습' ? r.training_gpu_ut ?? r.inference_gpu_ut : r.inference_gpu_ut;
    case 'gpu_ut_working':
      return r.inference_gpu_ut_working ?? 0;
    case 'gpu_ut_nonworking':
      return r.inference_gpu_ut_nonworking ?? 0;
    case 'slot_ut':
      return r.slot_ut;
    default:
      return 0;
  }
}

/**
 * GPU 활용 현황 page (v2 — Figma frames 7104:7375/8555/9862). The Live pill +
 * 기간/사업부/전략 filters + 지표 정의 link live in the app bar (see App.tsx);
 * this page's toolbar is Tabs + count (left) and 등급 필터 + Search + 다운로드
 * (right).
 */
export default function GpuResourcePage() {
  const [tab, setTab] = useState<TabKey>('추론'); // 추론 default, no 전체
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState<GradeFilterValue>('전체');
  const [page, setPage] = useState(1);

  const onTab = (k: TabKey) => {
    setTab(k);
    setPage(1);
  };
  const onQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const onGrade = (v: GradeFilterValue) => {
    setGrade(v);
    setPage(1);
  };

  // Client-side filtering: tab by member_tasks, search by project_name OR
  // user_id, grade via the 등급 필터 popover ('전체' clears).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!p.member_tasks.includes(tab)) return false;
      if (q && !p.project_name.toLowerCase().includes(q) && !p.user_id.toLowerCase().includes(q))
        return false;
      if (grade !== '전체' && p.grade !== grade) return false;
      return true;
    });
  }, [tab, query, grade]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Tab-dependent columns: 학습 drops GPU Util WH/AH and the 과제 column widens.
  const columns: DataTableColumn<ProjectRow>[] = useMemo(() => {
    const utilDefs: MetricDef[] =
      tab === '학습' ? [GPU_UTIL, SLOT_UTIL] : [GPU_UTIL, GPU_UTIL_WH, GPU_UTIL_AH, SLOT_UTIL];
    const cellColor = (expanded?: boolean) => (expanded ? SELECTED_TEXT : color.textPrimary);
    return [
      {
        key: 'project_name',
        header: '과제',
        width: tab === '학습' ? 682 : 510,
        render: (r, _i, expanded) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ ...text.bodyM, color: cellColor(expanded) }}>{r.project_name}</span>
            <GradeBadge grade={r.grade} />
          </span>
        ),
      },
      {
        key: 'division',
        header: '사업부',
        width: 246,
        render: (r, _i, expanded) => <span style={{ color: cellColor(expanded) }}>{r.division}</span>,
      },
      {
        key: 'purpose',
        header: '용도',
        width: 130,
        // nowrap keeps the fixed 41px row height for long strings (글로벌 파운드리 연계).
        render: (r, _i, expanded) => (
          <span style={{ color: cellColor(expanded), whiteSpace: 'nowrap' }}>{r.purpose}</span>
        ),
      },
      {
        key: 'is_critical',
        header: '전략여부',
        width: 90,
        align: 'center',
        // 전략 pill when Y, '-' dash when N (never empty).
        render: (r, _i, expanded) =>
          r.is_critical === 'Y' ? (
            <TaskTypeBadge kind="core" />
          ) : (
            <span style={{ color: cellColor(expanded) }}>-</span>
          ),
      },
      {
        key: 'user_id',
        header: '담당자',
        width: 80,
        render: (r, _i, expanded) => <span style={{ color: cellColor(expanded) }}>{r.user_id}</span>,
      },
      {
        key: 'quota',
        header: '수량(H100기준)',
        width: 110,
        align: 'right',
        render: (r, _i, expanded) => <span style={{ color: cellColor(expanded) }}>{num(r.quota)}</span>,
      },
      // Sort glyphs only on the four utilization columns (uniform 120px per Figma).
      ...utilDefs.map(
        (def): DataTableColumn<ProjectRow> => ({
          key: def.key,
          header: def.label,
          align: 'center',
          width: 120,
          sortable: true,
          render: (r) => <UtilBadge value={utilValue(r, def.key, tab)} metric={def.metric} />,
        }),
      ),
    ];
  }, [tab]);

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
    { label: '≥ 20%', lvl: u.good },
    { label: '10-20%', lvl: u.warn },
    { label: '< 10%', lvl: u.bad },
  ];
  const slotLegend = [
    { label: '≥ 80%', lvl: u.good },
    { label: '70-80%', lvl: u.warn },
    { label: '< 70%', lvl: u.bad },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      {/* Page toolbar: Tabs + count (left) · 등급 필터 + Search + 다운로드 (right) */}
      <div
        id="res-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.xl,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tabs tabs={tabs} active={tab} onChange={(k) => onTab(k as TabKey)} />
          {/* Two-tone count: shown '15' #565E66, '/30' #767D84 (f2_res_toolbar_l). */}
          <span style={text.body}>
            <span style={{ color: color.textSecondary }}>{pageRows.length}</span>
            <span style={{ color: color.textTertiary }}>/{filtered.length}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
          <GradeFilter value={grade} onChange={onGrade} />
          <SearchInput
            value={query}
            onChange={onQuery}
            placeholder="과제명/담당자 검색"
            width={200}
          />
          <DownloadButton />
        </div>
      </div>

      {/* Main expandable data table. */}
      <div id="res-table">
      <Card padding={0}>
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(r) => r.project_id}
          vPad={10}
          headerBg="#FAFBFC"
          caretWidth={42}
          rowStyle={(_r, _i, expanded) => (expanded ? { background: '#F0F7FC' } : undefined)}
          // Full-bleed expand panel: the detail supplies its own bg/padding.
          panelStyle={{ padding: 0, background: '#F6F8FA' }}
          expandedContent={(r) => (
            <ExpandedTaskDetail
              data={getProjectUnits(r.project_id)}
              taskType={tab}
              isStrategic={r.is_critical === 'Y'}
            />
          )}
          emptyText="조건에 맞는 과제가 없습니다"
        />

        {/* Footer INSIDE the white table card (7104:8535/8554, pad 12/16):
            pagination (centered) + threshold legend pills (right). */}
        <div
          id="res-footer"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: space.xl,
            padding: '12px 16px',
          }}
        >
          <div />
          <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.xl,
              justifySelf: 'end',
            }}
          >
            <LegendRow title="GPU Util" items={gpuLegend} />
            <LegendRow title="Slot Util" items={slotLegend} />
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}

/**
 * One labeled threshold scale as 48×16 r2 chips with a 1px semantic border
 * (audited frame 7104:8539-8552; text 400/11, label 400/12 #767D84).
 */
function LegendRow({
  title,
  items,
}: {
  title: string;
  items: { label: string; lvl: { bg: string; border: string; text: string } }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
      <span style={{ ...text.caption, color: color.textTertiary }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
        {items.map((it) => (
          <span
            key={it.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 16,
              boxSizing: 'border-box',
              borderRadius: radius.cell,
              background: it.lvl.bg,
              border: `1px solid ${it.lvl.border}`,
              color: it.lvl.text,
              ...text.tiny,
              whiteSpace: 'nowrap',
            }}
          >
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
