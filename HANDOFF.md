# HANDOFF — 새 프론트엔드 ↔ 기존 Backend API 연결 가이드

이 문서는 **사외 GitHub의 새 프론트엔드**(이 repo)를 **사내 GitHub의 기존 FastAPI 백엔드**에
연결하는 방법을 정의한다. `design-spec.md §7`이 예고한 "old component → new component,
prop → real API field, plus porting steps" 문서다.

- 사외 (프론트, 디자이너 협업):  `github.com/YoonsungNam/gpu-dashboard` ← **이 repo**
- 사내 (백엔드, 운영):           `github.samsungds.net/jeongh-ma/gpu-dashboard`

---

## 0. 아키텍처 결정 — 왜 분리하는가

**Backend는 사내에 둔다. 사외로 옮기지 않는다.** 기존 `backend/main.py`에는 사외로 나가면
안 되는 자산이 박혀 있다:

- DB 계정/비번 평문 (`collector / collector123`), 내부 호스트 `clickhouse-gpu-monitoring.clickhouse.svc`
- 내부 스키마 전체 (`dim_project_unit`, `fact_table_unit`, `dim_service` …)
- 운영 노하우가 담긴 SQL (가중평균 산식, 등급 임계값, KST 집계 경계)

프론트엔드 자산(컴포넌트·fetch·필드 변환)에는 비밀이 없으므로 사외에 둬도 안전하다.
**두 repo를 잇는 것은 코드가 아니라 "계약(contract)"이다.**

```
  사외 GitHub (디자이너 + 나)                사내 GitHub (운영)
┌──────────────────────────┐    계약    ┌───────────────────────────┐
│ src/ (새 프론트)            │ ◄───────► │ backend/main.py (FastAPI)  │
│ mock/types.ts  ← 계약 정본  │            │ openapi.yaml   ← 계약 추종  │
│ api/client.ts + adapters   │            │ + ClickHouse 비밀/스키마/SQL │
│ mock/* (디자이너 standalone) │            │ helm 배포                  │
└──────────────────────────┘            └───────────────────────────┘
```

- **계약 정본 = `src/mock/types.ts`** (이 repo). UI가 새 필드를 필요로 하면 여기서 먼저 정의한다.
- **계약 추종본 = `backend/openapi.yaml`** (사내). main.py 응답이 이를 따른다.
- 배포 시: 사내 repo의 기존 `App.jsx` 프론트를 이 repo의 `src/` 빌드로 최종 교체한다.

### ⚠️ 보안 — `deploy/`는 사외에 push 금지

`deploy/` 에는 **사내 전용** 자산이 들어 있다:

- 사내 프록시 IP `12.26.204.100` (`deploy/Dockerfile`)
- 사내 CA 인증서 `deploy/prx.crt` (samsungds-prx / SECDS-ROOTCA)
- 사내 레지스트리·클러스터명 `harbor.rancher.samsungds.net`, `dev-monitoring-ddz` (`deploy/preview.yaml`)

현재 `deploy/`는 git untracked 상태이고 **`.gitignore`에 등록돼 있지 않다** → 실수로
`git add .` 하면 사외(github.com)로 올라간다. 다음 중 하나로 막을 것:

1. `.gitignore`에 `deploy/` 추가 (이 repo에선 추적하지 않음), 또는
2. `deploy/` 전체를 사내 repo로 이전 (배포 정의는 사내가 소유).

---

## 1. 통합 봉합선 — "mock 함수"가 곧 연결 지점

screens는 데이터를 props로 받지 않는다. `filters: GlobalFilters`만 props로 받고,
**내부에서 mock 모듈의 순수 함수를 직접 동기 호출**한다:

| screen | 호출하는 함수 (from `mock/`) |
|---|---|
| `OverviewPage` | `getKpiByTask(f)`, `getRankByTask(f)`, `getUtilTrend(f)`, `getProjectUnits(id, task, f)`, `quotaByEnvGpu`, `trendAvg` |
| `GpuResourcePage` | `getKpiByTask(f)`, `getRankByTask(f)`, `filterProjects(f)`, `projectUtil(r, tab, f)`, `getProjectUnits(...)` |
| `TokenUsagePage` | `getTokenView(gf)`, `getGroupSeries(id, gf)`, `pivotTokenSeries(pts)` |

→ **포팅 = 이 함수들의 내부를 mock 대신 "실 fetch + adapter"로 바꾸는 것.**
   컴포넌트와 screens의 JSX는 손대지 않는다. 단 동기→비동기 전환이 필요하다 (§4).

기존 사내 `frontend/src/api.js` 의 fetch 래퍼는 이미 검증돼 있으므로 그대로 TS 포팅한다.

---

## 2. 엔드포인트별 갭 분석 (기존 backend 13개 → `mock/types.ts`)

기준: backend = `ds-inner/gpu-dashboard/backend/main.py` + `openapi.yaml`,
새 계약 = 이 repo `src/mock/types.ts`.

### 🟢 그대로 맞음 (어댑터 거의 불필요)

| backend 엔드포인트 | 새 타입 | 비고 |
|---|---|---|
| `GET /quota-by-env-gpu` | `QuotaByEnvGpu[]` | `environment, gpu_model, gpu_count` 동일 |
| `GET /gpu-count-by-task` | `GpuCountByTask` | `{ "추론": n, "학습": n }` 맵 동일 |
| `GET /service/timeseries` | `ServiceTimeseriesPoint[]` | `ts, service_id, service_name, total_tokens` 포함 (여분 필드 무시) |

### 🟡 필드 이름·형태 변환 필요 (adapter로 해결)

| backend | 새 타입 | 변환 내용 |
|---|---|---|
| `GET /projects` | `ProjectRow[]` | backend는 **동적 키**(`학습_gpu_ut`, `추론_gpu_ut`, `학습_gpu_total` …) → 평탄 필드(`inference_gpu_ut`, `training_gpu_ut`)로 매핑. `grade`는 backend에 없음 → `gradeOf()` 클라이언트 파생. backend 응답은 `{projects, tasks}` 래퍼 → `projects` 배열만 추출 |
| `GET /project/units` | `ProjectUnitsResponse` | `info`/`units` 구조 동일. `info.reclaim_estimate`는 backend에 없음 → `reclaimConds(task, purpose)` 로 클라이언트 파생 (현재 `getProjectUnits`가 하는 그대로) |
| `GET /top-bottom-projects` | (→ `getRankByTask` 형태) | backend는 `{ task: RankedProject[] }` (task별 **전체** 배열). 새 화면은 `{good, alert}` 분류본 필요 → adapter가 `gradeOf()`로 우수/저활용 분류 (현 mock `getRankByTask` 로직 재사용) |
| `GET /service/summary` | `ServiceSummary` | backend가 `avg_input/output/total` 모두 제공 → 여분 필드(`input_tokens` 등)만 drop |
| `GET /filters` | `Filters` | backend `{divisions, tasks, importance}` vs 새 `{divisions, importance, is_critical}`. `is_critical`은 상수 `['Y','N']`, `tasks`는 무시 |

### 🔴 backend에 없음 — 신규 필요 (사내 PR 대상)

| 새 타입 | 상태 | 권장 처리 |
|---|---|---|
| `KpiByTask.gpu_total` | backend `/kpi-by-task`엔 `project_count`만 있고 `gpu_total`(과제 quota 합) 없음. **필수 필드** (Overview 'GPUs' · 자원 Summary '총 GPU 수량'의 단일 소스) | **backend에 `gpu_total` 추가** (이미 `proj_quota` 합산 로직 존재 → SELECT에 더하면 됨) |
| `TokenGroupSummary[]` (`/token/groups`) | service-group 롤업 엔드포인트 자체가 없음 | §3 참조 — backend 신규 vs 프론트 집계 |
| `TokenTotals` (`/token/totals`) | KPI strip 합계 없음 | §3 참조 |

> 참고: backend `service/summary`·`service/timeseries` 응답에는 이미
> `service_group_id` / `service_group_name` 이 들어 있다 → 그룹 롤업의 원재료는 존재한다.

---

## 3. 미해결 결정 — 토큰 그룹 롤업을 어디서 만드나

`TokenUsagePage`는 `TokenView { totals, groups[] }`를 요구하는데, 각 group은
`share_pct`(그룹/서비스별 점유율), `service_count`, 정렬된 `services[]`를 포함한다.
backend엔 서비스 단위 합계만 있으므로 둘 중 하나를 선택해야 한다:

- **(A) backend 신규 엔드포인트** `/token/groups`·`/token/totals` — `service_group_id`로 GROUP BY.
  새 타입과 1:1, 집계가 서버에서 끝남. 장점: 프론트 가벼움 / 단점: 사내 backend 수정.
- **(B) 프론트 집계** — 기존 `/service/summary` 응답을 adapter에서 group 단위로 롤업,
  `share_pct`는 프론트 계산 (현 `mock/tokens.ts getTokenView`의 집계 로직 그대로 이식 가능).
  장점: backend 무변경 / 단점: adapter 복잡, 정렬·share 계산이 클라이언트로.

→ **운영팀과 합의 필요.** 합의 전까지는 (B)로 진행해도 mock 로직 재사용으로 빠르게 동작 가능.

---

## 4. 포팅 단계 (이 repo에서 할 일)

1. **`src/api/client.ts`** — 사내 `frontend/src/api.js` 를 TS 포팅.
   `BASE = '/board/api'`, days 매핑(`최근 N일`→숫자), `division`/`importance`/`is_critical`
   쿼리, `AbortController` 30s 타임아웃, `ALL`/빈값 제거.
2. **`src/api/adapters.ts`** — §2의 🟡 항목별 매퍼. 핵심:
   - `adaptProjects(raw)`: 동적키 평탄화 + `gradeOf()` 부여
   - `adaptRank(raw, f)`: backend 전체 배열 → `{good, alert}` 분류 (`gradeOf`)
   - `adaptProjectUnits(raw, task, purpose)`: `reclaimConds()`로 `reclaim_estimate` 부여
   - `adaptFilters(raw)`: `is_critical: ['Y','N']` 주입
   - `gradeOf`/`reclaimConds`는 `lib/gradePolicy.ts` 의 것을 그대로 재사용한다 (mock과 동일 로직).
3. **데이터 진입 비동기화** — 현재 screens가 동기 호출 중인 mock 함수를 대체.
   기존 `App.jsx`의 `useData` 패턴(`Promise.all` 일괄 로드 + race-id로 stale 방지)을
   `App.tsx`로 포팅하고, fetch→adapter 결과를 screens에 주입.
   mock 함수는 **삭제하지 말고 보존** → `VITE_USE_MOCK` 플래그로 real/mock 토글
   (디자이너 standalone 실행 + 오프라인 fallback 유지).
4. **`vite.config.ts` proxy** — dev에서 `/board/api` → `http://localhost:8000` 프록시 추가
   (사내 `frontend/vite.config.js`와 동일 규칙).
5. **배포** — 사내 repo 프론트를 이 repo `src/` 빌드(`npm run build` → `dist/`)로 교체.
   `deploy/`(프록시 빌드·harbor 푸시·k8s)는 사내에서 수행.

---

## 5. 계약 동기화 워크플로 (지속)

UI 변경으로 새 필드/엔드포인트가 필요할 때:

1. 사외에서 `src/mock/types.ts` 에 필드를 **먼저** 정의 (계약 정본 갱신).
2. 그 델타를 사내 backend 이슈/PR로 전달 → `openapi.yaml` + `main.py` 응답에 반영.
3. backend 배포 후, 이 repo `src/api/adapters.ts` 가 새 필드를 매핑.

데이터 계약(키 형태)을 한쪽이 어기면 프론트가 깨진다 (기존 사내 CLAUDE.md 규칙).
`types.ts` ↔ `openapi.yaml` 두 파일을 양 끝의 single source로 유지하면 불일치가 즉시 드러난다.

### 불변 규칙 (양 repo 공통)

- `task` 값은 한글 `'학습'` / `'추론'` 이 DB·API·UI 전반에 하드코딩 — 영문/소문자로 바꾸지 말 것.
- util 지표 매핑 (`src/lib/labels.ts`): `GPU Util`=`gpu_ut`/`avg_gpu_ut`,
  `GPU Util WH`=`gpu_ut_working`, `GPU Util AH`=`gpu_ut_nonworking`, `Slot Util`=`slot_ut`/`avg_slot_ut`.
- 학습 Quota는 화면/Excel에서 `quota/8` 로 H100 환산 (backend export가 이미 적용).
- 집계 끝점은 "어제 23:59:59 (KST)", 오늘 데이터 미포함 (backend `time_range`/`tw_kst`).
- 등급 임계값은 `src/lib/gradePolicy.ts` `GRADE_POLICY` 단일 소스 — backend 산식과 일치 유지.

---

## 6. 사내에서 프론트 코드를 고치지 않는다 (single-source 원칙)

프론트 **코드 변경은 사외에서만** 한다. 사내 repo의 프론트는 사외 빌드 산출물(또는
읽기전용 미러)일 뿐, 편집 대상이 아니다. 사내에서 코드를 고치기 시작하면 fork가 생기고
두 repo가 갈라져(drift) "계약 single source" 원칙이 깨진다.

사외(mock standalone)와 사내(실 API)의 차이는 **코드가 아니라 설정으로** 흡수한다:

| 환경 차이 | ✗ 잘못 (코드 fork) | ✓ 올바름 (설정) |
|---|---|---|
| mock vs 실 API | 사내에서 호출을 fetch로 교체 | `VITE_USE_MOCK` 환경변수 |
| API 주소 (`/board/api`) | 사내에서 하드코딩 변경 | `VITE_API_BASE` 환경변수 |
| dev 프록시 | — | `vite.config.ts` (dev 전용, prod는 nginx) |
| 프록시 빌드·harbor·k8s | (프론트 코드 아님) | `deploy/` = 사내 전용 배포 설정 |

→ 토글(`VITE_USE_MOCK`)을 **사외 코드에 미리 내장**해 두면, 사내는 "환경변수만 바꿔
빌드"하면 되고 코드 편집이 **0**이다. 전제 두 가지: (a) adapter 계층을 사외에 작성,
(b) 환경별로 다른 값(주소·플래그)을 하드코딩하지 말고 env로 분리.

```
사외 (편집하는 곳)                       사내 (편집 안 하는 곳)
├─ src/ 전체 (컴포넌트+adapters+client)    ├─ 프론트 = 사외 빌드 산출물 (dist/)
├─ mock/* (standalone용)                 │   └─ 코드 수정 ✗, 환경변수만 주입
└─ VITE_USE_MOCK 등 토글 내장             └─ deploy/ (Dockerfile·nginx·k8s) = 사내 소유
```
