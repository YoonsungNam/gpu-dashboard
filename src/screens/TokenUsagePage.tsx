import { useMemo, useState } from 'react';
import { color, space } from '../tokens';
import SearchInput from '../components/primitives/SearchInput';
import DownloadButton from '../components/primitives/DownloadButton';
import ServiceCountKpis from '../components/compositions/ServiceCountKpis';
import TokenGroupTable from '../components/compositions/TokenGroupTable';
import ServiceListModal from '../components/compositions/ServiceListModal';
import TokenTrendChart from '../components/charts/TokenTrendChart';
import { groupTokenTimeseries, pivotTokenSeries, serviceGroups, tokenTotals } from '../mock/tokens';

/**
 * 토큰 활용 현황 page (v2 — Figma frames 7104:2731 collapse / ~7104:3480
 * expand). The Live pill + 기간/사업부/전략 filters + 지표 정의 link live in
 * the app bar (see App.tsx); this page is the KPI/toolbar row + the grouped
 * token table card. No pagination exists in this design.
 */
export default function TokenUsagePage() {
  const [query, setQuery] = useState('');
  // Single-open accordion for the per-group chart panel.
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [modalGroupId, setModalGroupId] = useState<string | null>(null);

  // Client-side search across group name OR child service names.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return serviceGroups;
    return serviceGroups.filter(
      (g) =>
        g.service_group_name.toLowerCase().includes(q) ||
        g.services.some((s) => s.service_name.toLowerCase().includes(q)),
    );
  }, [query]);

  const modalGroup = modalGroupId
    ? serviceGroups.find((g) => g.service_group_id === modalGroupId) ?? null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
      {/* KPI/toolbar row (56px, no card): KPI strip left · search + 다운로드 right */}
      <div
        id="tok-toolbar"
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.xl,
        }}
      >
        <ServiceCountKpis totals={tokenTotals} />
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, alignSelf: 'flex-end' }}>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="과제명/담당자 검색"
            width={200}
          />
          <DownloadButton />
        </div>
      </div>

      {/* Grouped token table card (Frame 26096792, white r6). overflow 'clip'
          keeps the r6 corner clipping without breaking the sticky header. */}
      <div id="tok-table" style={{ background: color.cardBg, borderRadius: 6, overflow: 'clip' }}>
        <TokenGroupTable
          groups={filtered}
          expandedGroupId={expandedGroupId}
          onToggleGroup={(id) => setExpandedGroupId((prev) => (prev === id ? null : id))}
          onMoreServices={setModalGroupId}
          renderExpandedPanel={(g) => {
            const feed = pivotTokenSeries(groupTokenTimeseries[g.service_group_id] ?? []);
            return <TokenTrendChart rows={feed.rows} series={feed.series} />;
          }}
        />
      </div>

      {modalGroup && (
        <ServiceListModal
          group={modalGroup}
          dayCount={tokenTotals.day_count}
          onClose={() => setModalGroupId(null)}
        />
      )}
    </div>
  );
}
