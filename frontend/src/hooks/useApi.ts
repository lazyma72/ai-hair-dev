/**
 * useApi — 通用数据请求 hook
 *
 * 使用方式：
 *   const { data, loading, error, reload } = useApi(() => callApi("file/GetList", {}))
 *
 * 设计原则：
 *   - 只负责"加载状态 + 数据 + 报错"三件事
 *   - 不依赖任何具体接口，所有接口逻辑在各 page 里写
 *   - reload() 可手动刷新
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<
    { isSucc: true; res: T } | { isSucc: false; err: { message: string } }
  >,
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Use a counter to trigger re-fetch
  const [tick, setTick] = useState(0);
  // Keep a stable ref to the latest fetcher so reload doesn't require memoisation by caller
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const result = await fetcherRef.current();
        if (cancelled) return;
        if (result.isSucc) {
          setData(result.res);
        } else {
          setError(result.err.message);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "请求失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}
