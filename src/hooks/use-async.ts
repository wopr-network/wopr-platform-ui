import { useCallback, useEffect, useRef, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  execute: (...args: unknown[]) => void;
}

export function useAsync<T>(asyncFn: (...args: unknown[]) => Promise<T>): AsyncState<T> {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const mountedRef = useRef(true);
  const callIdRef = useRef(0);
  // Track latest asyncFn so execute doesn't need it as a dep
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback((...args: unknown[]) => {
    const id = ++callIdRef.current;
    setStatus("loading");
    setData(undefined);
    setError(undefined);

    asyncFnRef.current(...args).then(
      (result) => {
        if (mountedRef.current && callIdRef.current === id) {
          setData(result);
          setStatus("success");
        }
      },
      (err) => {
        if (mountedRef.current && callIdRef.current === id) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus("error");
        }
      },
    );
  }, []);

  return { status, data, error, isLoading: status === "loading", execute };
}
