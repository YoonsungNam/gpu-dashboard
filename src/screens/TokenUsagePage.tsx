import { useMemo, useState } from 'react';
import { color, space } from '../tokens';
import SearchInput from '../components/primitives/SearchInput';
import DownloadButton from '../components/primitives/DownloadButton';
import ServiceCountKpis from '../components/compositions/ServiceCountKpis';
import TokenGroupTable from '../components/compositions/TokenGroupTable';
import ServiceListModal from '../components/compositions/ServiceListModal';
import TokenTrendChart from '../components/charts/TokenTrendChart';
import { getGroupSeries, getTokenView, pivotTokenSeries } from '../mock/tokens';
import type { GlobalFilters } from '../mock/data';
import { downloadCsv } from '../lib/csv';
import { ioRatio } from '../lib/util';

/**
 * 토큰 활용 현황 page (v2 — Figma frames 7104:2731 collapse / ~7104:3480
 * expand). The Live pill + 기간/사업부/전략 filters + 지표 정의 link live in
 * the app bar (see App.tsx); this page is the KPI/toolbar row + the grouped
 * token table card. No pagination exists in this design.
 */
export default function TokenUsagePage({ filters: gf }: { filters: GlobalFilters }) {
  // The whole view (KPIs, groups, children, shares) derives from the header filters.
  const view = useMemo(() => getTokenView(gf), [gf]);
  const [query, setQuery] = useState('');
  // Single-open accordion for the per-group chart panel.
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [modalGroupId, setModalGroupId] = useState<string | null>(null);

  // Client-side search across group name OR child service names.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return view.groups;
    return view.groups.filter(
      (g) =>
        g.service_group_name.toLowerCase().includes(q) ||
        g.services.some((s) => s.service_name.toLowerCase().includes(q)),
    );
  }, [query, view]);

  const modalGroup = modalGroupId
    ? view.groups.find((g) => g.service_group_id === modalGroupId) ?? null
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
        <ServiceCountKpis totals={view.totals} />
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, alignSelf: 'flex-end' }}>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="과제명/담당자 검색"
            width={200}
          />
          <DownloadButton
            onClick={() =>
              downloadCsv(
                '토큰활용현황',
                ['구분', '서비스 그룹', '서비스', '사업부', '모델', '토큰 점유율(%)', '일평균 Input', '일평균 Output', 'I:O', '일평균 합계'],
                filtered.flatMap((g) => [
                  ['그룹', g.service_group_name, '', g.division, '', g.share_pct, g.avg_input, g.avg_output, ioRatio(g.avg_input, g.avg_output), g.avg_total],
                  ...g.services.map((sv) => [
                    '서비스', g.service_group_name, sv.service_name, g.division, sv.model,
                    sv.share_pct, sv.avg_input, sv.avg_output, ioRatio(sv.avg_input, sv.avg_output), sv.avg_total,
                  ]),
                ]),
              )
            }
          />
        </div>
      </div>

      {/* Grouped token table card (Frame 26096792, white r6). The card itself
          is the scrollport: the table carries a 1100px minWidth, so narrow
          viewports scroll horizontally HERE, and maxHeight bounds the card so
          the thead's position:sticky sticks within it. An inner overflow-x
          wrapper around the table cannot work — a scroll value on one axis
          forces the used overflow-y to 'auto', making the (height-
          unconstrained, never-vertically-scrolling) wrapper the th's
          scrollport, i.e. the header would never stick. overflow:auto still
          clips the r6 corners like the previous 'clip' did. */}
      <div
        id="tok-table"
        style={{
          background: color.cardBg,
          borderRadius: 6,
          overflow: 'auto',
          // 100vh − (topbar 56 + main padding 16×2 + toolbar row 56 + page gap 12)
          maxHeight: 'calc(100vh - 156px)',
        }}
      >
        <TokenGroupTable
          groups={filtered}
          expandedGroupId={expandedGroupId}
          onToggleGroup={(id) => setExpandedGroupId((prev) => (prev === id ? null : id))}
          onMoreServices={setModalGroupId}
          renderExpandedPanel={(g) => {
            const feed = pivotTokenSeries(getGroupSeries(g.service_group_id, gf));
            return <TokenTrendChart rows={feed.rows} series={feed.series} />;
          }}
        />
      </div>

      {modalGroup && (
        <ServiceListModal
          group={modalGroup}
          dayCount={view.totals.day_count}
          onClose={() => setModalGroupId(null)}
        />
      )}
    </div>
  );
}
