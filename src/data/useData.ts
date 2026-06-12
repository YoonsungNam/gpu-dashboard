import { useEffect, useRef, useState, type DependencyList } from 'react';

export interface UseDataState<T> {
  /** 로드 완료 전 null. 재로드 중에는 직전 데이터를 유지한다 (필터 변경 시 깜빡임 방지). */
  data: T | null;
  loading: boolean;
  error: unknown;
}

/**
 * 화면 데이터 로더 훅 (HANDOFF §4-3) — 사내 App.jsx useData 패턴의 포팅.
 * deps가 바뀔 때마다 load()를 다시 부르고, race-id로 늦게 도착한 stale 응답을
 * 무시한다 (필터를 빠르게 바꿀 때 이전 요청이 나중에 resolve해도 화면을 덮지 않음).
 * 보통 load는 `() => Promise.all([...])` 일괄 로드다.
 */
export function useData<T>(load: () => Promise<T>, deps: DependencyList): UseDataState<T> {
  const [state, setState] = useState<UseDataState<T>>({ data: null, loading: true, error: null });
  const raceId = useRef(0);

  useEffect(() => {
    const id = ++raceId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    load().then(
      (data) => {
        if (raceId.current === id) setState({ data, loading: false, error: null });
      },
      (error) => {
        if (raceId.current === id) setState((s) => ({ ...s, loading: false, error }));
      },
    );
    // load 콜백 자체는 deps의 파생이므로 deps만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
