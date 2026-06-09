# GPU Dashboard — Design Spec (extracted from Figma)

**Source:** Figma `[공유용]GPU Dashboard` · file `9NJCWQplwN2chEpFrCKILG` · page `⭐최종본&디자인가이드⭐` · lastModified 2026-06-08
**Frames:** GPU_Overview(1) `7001:46341`, GPU_Overview(2) `7001:47544`, GPU_자원(1) `7001:48845`, GPU_자원(2) `7001:50027`, Badge Color guide `7001:51337`
**Raw evidence:** [`figma-extract.json`](./figma-extract.json) · High-res renders: `GPU_Overview1.png`, `GPU_Overview2.png`, `GPU_Resource1.png`, `GPU_Resource2.png`
**Tokens:** implemented in [`../src/tokens.ts`](../src/tokens.ts)

> Scope: **frontend-only redesign** of an existing internal dashboard. Backend/API unchanged → all components are **pure presentational** (props in, no fetching). Built externally (Scenario B), handed off for porting into the internal repo. Stack must match: **React 18 + Vite + Recharts + inline CSS**.

---

## 1. Color system

| Group | Tokens |
|---|---|
| Surfaces | pageBg `#F2F6F9`, cardBg `#FFFFFF`, cardBgAlt `#F6F8FA`, rowHover `#FAFBFC` |
| Sidebar (dark) | bg `#002035`, activeItem `#0064A7`, text `#B9BBBE`, textActive `#FFFFFF` |
| Borders | border `#E4E9ED`, strong `#CCD1D6`, subtle `#DADFE4` |
| Text | primary `#2F363C`, secondary `#565E66`, tertiary `#767D84`, muted `#90969D`, disabled `#B2B6BB` |
| Brand blues | brand `#0077C8`, strong `#0064A7`, light `#3392D3`, cyan `#00B3E2` |

### Semantic — threshold & badge colors (from the "Badge Color" guide)
These are the most important semantic tokens; the whole dashboard is color-coded by GPU/Slot utilization thresholds.

| Meaning | bg | border | text | Example |
|---|---|---|---|---|
| **good / high util** | `#D4F1D7` | `#AAE4B0` | `#0D3D13` | `90.0%` |
| **warn / mid util** | `#FFE1B5` | `#FFD390` | `#6B4915` | `78.7%` |
| **bad / low util** | `#FFD9D7` | `#FFC7C3` | `#A52921` | `12.4%` |
| 추론 (Inference) badge | `#CCF0F9` | — | `#007492` | "추론" |
| 학습 (Training) badge | `#E0D9FF` | — | `#5A49A6` | "학습" |
| 핵심 (Core) badge | `#ECF1F5` | — | `#565E66` | "핵심" |
| delta up / down | — | — | `#239B2F` / `#FF4337` | trend |

> ⚠️ **Open question for you:** the exact %% breakpoints that map a value → good/warn/bad. The guide says "GPU UTIL, SLOT UTIL 임계 기준에 따른 컬러" but not the numbers. I'll make the thresholds a single configurable function (`utilLevel(value)`); tell me the real cutoffs (e.g. ≥80 good / 30–80 warn / <30 bad) or I'll use sensible defaults.

### Categorical palette (GPU-model stacked bars & multi-series charts)
`#00B3E2 #00C3B1 #008074 #66D1EE #96D552 #55C961 #6978B8 #5A49A6 #3A4571 #3392D3`

---

## 2. Typography — **Pretendard GOV** (primary)

| Token | Size / line / weight | Used for |
|---|---|---|
| sectionTitle | 20 / 24 / 600 | section headers ("GPU 활용현황") |
| cardTitle | 16 / 20 / 600 | card titles ("Inference / 추론") |
| metricXl | 28 / 36 / 600 | hero numbers (521, 852) |
| metricTotal | 26 / 28 / 600 | total (2,941) |
| metricLg | 24 / 28 / 600 | expanded-row stats (90.0) |
| bodyM / body | 14 / 20 / 500·400 | default text & labels |
| label / caption | 12 / 14 / 500·400 | chips ("Projects"), descriptions |
| tiny / numTiny | 11 / 12·13 / 400·700 | dense counts |
| axis | 10 / 12 / 400 (Inter) | chart ticks |

Logo "GPU Monitor" uses **Samsung Sharp Sans** 19/700.

---

## 3. Spacing · Radius · Elevation
- **Spacing scale** (auto-layout gaps): 2 · 4 · 6 · 8 · 12 · 16 · 20 (base ≈ 4; 8 and 16 dominate).
- **Radius:** cell `2`, sm `4`, **card `8`**, lg `10`, xl `20`, **pill `100`**.
- **Card shadow:** `0 1px 2px rgba(40,48,55,.12), 0 0 2px rgba(40,48,55,.12)`.

---

## 4. App shell (shared by all screens)
- **Left sidebar** (~160px, `#002035`): logo "GPU Monitor" → nav: **Overview** · **GPU 자원** · 그 외 → footer (version + `Samsung ...`). Active item highlighted blue, white text.
- **Top bar** (~48px, light): page title left; right cluster of **filter dropdowns** + date + (on GPU 자원) a **다운로드** button (Excel export — backend uses openpyxl).
- **Content:** `#F2F6F9`, max-width grid, 16px padding; stacked **sections** each = header row (icon + 20/600 title + caption) followed by white card(s) with 8px radius + card shadow.

---

## 5. Screens

### A. Overview — `GPU_Overview(1)` (default) / `(2)` (row expanded)
1. **GPU 활용현황** — 2 cards (Inference / Training). Each: hero number (521 / 852) + "N Projects", and 4 horizontal **progress bars** (GPU UM, GPU UA, GPU UI, Run UM) with % on the right, colored by threshold.
2. **GPU 보유현황** — full-width card. Left: 4 **stacked horizontal bars** (점유율 by category) segmented by GPU-model color + top legend chips. Right: **total 2,941** + per-model list (count + %).
3. **GPU 활용도 점유** — 2 columns (Inference / Training); each has a "N Projects" chip and two **rank tables**: 우수 활용 과제 / 저활용 과제. Cols: rank, task name, **type badge**, GPU UM, Run UM, count.
4. **GPU 사용추이** — 2 cards (Inference / Training): 30-day **line/area charts**, legend GPU UM / Run UM, small stat header.

**Detail pattern (Overview 2):** clicking a 우수활용 row **expands inline** → a 4-metric strip (GPU UM 90.0 / GPU UA 85.1 / GPU UI 97.1 / Run UM 67.1) + a **UNIT 정보** sub-table. *Not* a separate route.

### B. GPU 자원 — `GPU_자원(1)` (default) / `(2)` (row expanded)
- Top: title "GPU 자원" + filter dropdowns + date + 다운로드.
- **Tabs** (전체(28) / 학습 …) + **search** box.
- **Data table** — columns: expand caret, #, 과제명 (long), 구분 (System LSF / Foundry 시뮬레이션 / 글로벌 파운드리 …), 유형 (백오피스 / RT API …), count, then **GPU UM · GPU UA · GPU UI · Run UM** as threshold-colored cells.
- **Pagination** (1…10) + a threshold **legend** at bottom.

**Detail pattern (GPU 자원 2):** row **expands inline** → summary strip (1289 / 67.4 / 85.3 / 92.3 / 67.1%) + **UNIT 정보** sub-table (per-server rows: model, GPU count, util cells).

---

## 6. Component inventory (build targets)
Pure presentational, props-driven. `↺` = likely reusable across both screens.

**Layout / shell** `↺`: `AppShell`, `Sidebar`, `TopBar`, `FilterBar`, `PageSection`.
**Primitives** `↺`: `Card`, `StatHero` (big number + label), `UtilBadge` (threshold pill), `TaskTypeBadge`, `ProgressBar`, `DataTable` (sortable, **expandable rows**), `Tabs`, `SearchInput`, `Pagination`, `DownloadButton`, `DeltaText`, `Legend`.
**Charts (Recharts wrappers)** `↺`: `StackedBar` (보유현황), `TrendChart` (line/area 사용추이), `RankTable` (활용도 점유), `MiniSparkline`.
**Compositions:** `OverviewPage`, `GpuResourcePage`, `ExpandedTaskDetail` (shared 4-metric strip + UNIT 정보 sub-table used by both screens' expanded rows).

---

## 7. Integration seam (handoff)
- `src/mock/types.ts` defines the prop shape each component expects — **this is the contract** the internal app maps its real API onto.
- `src/mock/data.ts` provides realistic mock so the kit runs standalone.
- `HANDOFF.md` (to be written) will map **old component → new component** and **prop → real API field**, plus the porting steps.
- **Needed from you (optional, sharpens the seam):** the real API **response JSON shapes** (not code) behind these screens, and the real **utilization thresholds**.
