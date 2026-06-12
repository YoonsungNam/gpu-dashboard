/**
 * 환경 토글의 단일 진입점 (HANDOFF.md §6).
 * 사외(mock standalone)와 사내(실 API)의 차이는 코드 fork가 아니라 이 두 값으로
 * 흡수한다 — 사내는 환경변수만 바꿔 빌드하고 코드는 편집하지 않는다.
 */

/** true(기본)면 mock 데이터, 'false'로 빌드하면 실 백엔드 API를 쓴다. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/** 실 API 베이스 경로 (기존 사내 frontend/src/api.js 의 BASE와 동일 기본값). */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/board/api';
