import { useCallback, useRef, useState } from "react";

function readStorage<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readStorage(key, initialValue));

  // Finding 4: capture initialValue on mount so object literals don't bust removeValue memo
  const initialValueRef = useRef(initialValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        // Finding 1: use typeof instead of instanceof Function so stored function
        // values (when T is a function type) are not mistakenly treated as updaters
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        if (typeof window !== "undefined") {
          // Finding 2: guard setItem against QuotaExceededError / SecurityError
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // Storage write failed — state update still proceeds
          }
        }
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
    setStoredValue(initialValueRef.current);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
