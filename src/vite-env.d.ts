/// <reference types="vite/client" />

// 데이터 소스 토글 (HANDOFF.md §6) — 환경 차이는 코드 fork가 아니라 이 변수로 흡수.
interface ImportMetaEnv {
  /** 'true'(기본): mock standalone 실행 · 'false': 실 백엔드 API 호출. */
  readonly VITE_USE_MOCK?: string;
  /** 실 API 베이스 경로 — 기본 '/board/api' (dev는 vite proxy, prod는 nginx). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
