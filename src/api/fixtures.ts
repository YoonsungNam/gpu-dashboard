/**
 * backend 샘플 응답 fixture — openapi.yaml 예시 기반의 "가정"을 실행 가능한
 * 사양으로 고정한 것 (HANDOFF §2). tools/adapter_test.ts 가 이걸 입력으로
 * adapter 출력을 검증한다. 사내 openapi.yaml과 대조해 키가 다르면 여기와
 * adapters.ts 를 함께 고칠 것 (이 파일이 양쪽 불일치를 드러내는 지점).
 */
import type {
  RawFilters,
  RawKpiByTask,
  RawProjectsResponse,
  RawProjectUnitsResponse,
  RawRankByTask,
  RawServiceSummary,
  RawUtilTrend,
} from './adapters';
import type { ServiceTimeseriesPoint } from '../mock/types';

/** GET /projects — 동적 태스크 키 + {projects, tasks} 래퍼. */
export const FIX_PROJECTS: RawProjectsResponse = {
  tasks: ['추론', '학습'],
  projects: [
    {
      project_id: 'P001',
      project_name: '추천 엔진 RT',
      division: 'DX',
      purpose: '생산시스템 연계',
      business_importance: '핵심',
      is_critical: 'Y',
      user_id: 'kim.cs',
      quota: 16,
      slot_ut: 68.2,
      추론_gpu_ut: 19.7,
      추론_gpu_ut_working: 27.7,
      추론_gpu_ut_nonworking: 3.7,
    },
    {
      // quota 키가 없고 동적 '학습_gpu_total'만 있는 행 (폴백 경로 검증)
      project_id: 'P002',
      project_name: '수율 예측 학습',
      division: '메모리',
      purpose: '모델 학습',
      is_critical: 'N',
      user_id: 'lee.yh',
      slot_ut: 90.0,
      학습_gpu_ut: 84.0,
      학습_gpu_total: 32,
    },
    {
      project_id: 'P003',
      project_name: '문서 요약 RT',
      division: 'AI센터',
      purpose: '일반업무',
      is_critical: 'N',
      user_id: 'park.jm',
      quota: 8,
      slot_ut: 82.0,
      추론_gpu_ut: 55.0,
      추론_gpu_ut_working: 63.0,
      추론_gpu_ut_nonworking: 39.0,
    },
  ],
};

/** GET /top-bottom-projects — task별 전체 배열 (good/alert 미분류). */
export const FIX_RANK: RawRankByTask = {
  추론: [
    // 우수 (gpu ≥ 40) — 정렬 검증용으로 2건, gpu 내림차순이어야 함
    { project_id: 'R1', project_name: '광고 추천 학습', division: 'DX', purpose: '일반업무', is_critical: 'N', quota: 24, gpu_ut: 56.8, gpu_ut_working: 64.0, slot_ut: 97.4 },
    { project_id: 'R2', project_name: '리뷰 분석', division: 'S.LSI', purpose: '서비스테스트', is_critical: 'N', quota: 8, gpu_ut: 45.0, gpu_ut_working: 52.0, slot_ut: 83.0 },
    // 저활용 (생산시스템 연계: slot ≤ 75)
    { project_id: 'R3', project_name: '백오피스 추론', division: 'SAIT', purpose: '생산시스템 연계', is_critical: 'N', quota: 16, gpu_ut: 20.0, gpu_ut_working: 28.0, slot_ut: 70.0 },
    // 중간 (일반업무: wh 38 ≥ 30, slot 80 > 75 → 어느 쪽도 아님)
    { project_id: 'R4', project_name: '번역 엔진', division: '메모리', purpose: '일반업무', is_critical: 'N', quota: 8, gpu_ut: 30.0, gpu_ut_working: 38.0, slot_ut: 80.0 },
  ],
  학습: [
    // 우수 (gpu ≥ 50 and slot ≥ 80)
    { project_id: 'R5', project_name: '검색 랭킹 학습', division: '메모리', purpose: '모델 학습', is_critical: 'Y', quota: 32, gpu_ut: 84.8, slot_ut: 93.9 },
    // 저활용 (모델 개발: gpu ≤ 5)
    { project_id: 'R6', project_name: '공정 최적화', division: 'DX', purpose: '모델 개발', is_critical: 'N', quota: 16, gpu_ut: 4.0, slot_ut: 88.0 },
  ],
};

/** GET /kpi-by-task — gpu_total 없는 버전 (🔴 폴백 경로 검증). */
export const FIX_KPI_NO_TOTAL: RawKpiByTask[] = [
  { task: '추론', avg_gpu_ut: 35.8, avg_slot_ut: 79.9, avg_gpu_ut_working: 43.8, avg_gpu_ut_nonworking: 19.8, project_count: 2 },
  { task: '학습', avg_gpu_ut: 57.1, avg_slot_ut: 79.7, project_count: 1 },
];

/** gpu_total을 주는 버전 (backend 반영 후의 응답 — 그대로 통과해야 함). */
export const FIX_KPI_WITH_TOTAL: RawKpiByTask[] = [
  { task: '추론', avg_gpu_ut: 35.8, avg_slot_ut: 79.9, project_count: 51, gpu_total: 660 },
  { task: '학습', avg_gpu_ut: 57.1, avg_slot_ut: 79.7, project_count: 79, gpu_total: 2200 },
];

/** GET /project/units — reclaim_estimate 없는 원시 응답. */
export const FIX_UNITS: RawProjectUnitsResponse = {
  info: {
    project_name: '추천 엔진 RT',
    division: 'DX',
    purpose: '생산시스템 연계',
    business_importance: '핵심',
    gpu_ut: 19.7,
    gpu_ut_working: 27.7,
    gpu_ut_nonworking: 3.7,
    slot_ut: 68.2,
  },
  units: [
    { unit_id: 'U001', unit_name: 'ais-mx사업부-serve-01', task: '추론', gpu_model: 'H100', gpu_num: 4, unit_quota: 4, slot_ut: 63.4, gpu_ut: 32.2 },
    { unit_id: 'U002', unit_name: 'ais-mx사업부-serve-02', task: '추론', gpu_model: 'V100', gpu_num: 4, unit_quota: 4, slot_ut: 68.8, gpu_ut: 17.7 },
    { unit_id: 'U003', unit_name: 'ais-dx사업부-serve-03', task: '추론', gpu_model: 'P100', gpu_num: 4, unit_quota: 4, slot_ut: 79.9, gpu_ut: 6.1 },
    { unit_id: 'U004', unit_name: 'ais-dx사업부-serve-04', task: '추론', gpu_model: 'P40', gpu_num: 4, unit_quota: 4, slot_ut: 81.1, gpu_ut: 5.6 },
  ],
};

/** GET /filters — is_critical 목록 없음 (adapter가 주입). */
export const FIX_FILTERS: RawFilters = {
  divisions: ['AI센터', 'DX', 'S.LSI', 'SAIT', '글로벌 제조&인프라총괄', '메모리'],
  tasks: ['추론', '학습'],
  importance: ['전략', '핵심', '일반'],
};

/** GET /timeseries-by-task — task별 레코드 형태. */
export const FIX_TREND_RECORD: RawUtilTrend = {
  추론: [
    { ts: '2026-05-04', gpu_ut: 42.1, slot_ut: 79.9 },
    { ts: '2026-05-05', gpu_ut: 43.0, slot_ut: 80.2 },
  ],
  학습: [{ ts: '2026-05-04', gpu_ut: 57.0, slot_ut: 79.5 }],
};

/** 같은 데이터의 평탄 배열 형태 (둘 다 같은 결과로 정규화되어야 함). */
export const FIX_TREND_FLAT: RawUtilTrend = [
  { task: '추론', ts: '2026-05-04', gpu_ut: 42.1, slot_ut: 79.9 },
  { task: '추론', ts: '2026-05-05', gpu_ut: 43.0, slot_ut: 80.2 },
  { task: '학습', ts: '2026-05-04', gpu_ut: 57.0, slot_ut: 79.5 },
];

/** GET /service/summary — 그룹 롤업 원재료 (여분 필드 input_tokens 포함). */
export const FIX_SERVICE_SUMMARY: RawServiceSummary = {
  day_count: 28,
  services: [
    { service_id: 'S1', service_name: 'Moderation Pro', service_group_id: 'G1', service_group_name: 'Chat Services', division: 'DX', model: 'GPT-OSS', avg_input: 30_000_000, avg_output: 20_000_000, input_tokens: 999 },
    { service_id: 'S2', service_name: 'Code Assist', service_group_id: 'G1', service_group_name: 'Chat Services', division: 'DX', avg_input: 10_000_000, avg_output: 10_000_000 },
    { service_id: 'S3', service_name: 'Health API', service_group_id: 'G2', service_group_name: 'DS Health', division: 'AI센터', model: 'Qwne-32B', avg_input: 20_000_000, avg_output: 10_000_000 },
  ],
};

/** GET /service/timeseries — 그룹 차트 필터링 검증용. */
export const FIX_SERVICE_TS: ServiceTimeseriesPoint[] = [
  { service_id: 'S3', service_name: 'Health API', ts: '2026-05-04', total_tokens: 31_000_000 },
  { service_id: 'S2', service_name: 'Code Assist', ts: '2026-05-04', total_tokens: 21_000_000 },
  { service_id: 'S1', service_name: 'Moderation Pro', ts: '2026-05-04', total_tokens: 52_000_000 },
  { service_id: 'S1', service_name: 'Moderation Pro', ts: '2026-05-05', total_tokens: 49_000_000 },
];
