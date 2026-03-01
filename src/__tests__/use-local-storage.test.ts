import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "../hooks/use-local-storage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Finding 1: typeof check for functional updater when T is a function type
  it("uses functional updater form to derive next value from previous", () => {
    const { result } = renderHook(() => useLocalStorage<number>("count", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(JSON.parse(localStorage.getItem("count") ?? "null")).toBe(1);
  });

  // Finding 2: try/catch around setItem
  it("does not throw when localStorage.setItem throws QuotaExceededError", () => {
    const { result } = renderHook(() => useLocalStorage<string>("key", "init"));

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => {
      act(() => {
        result.current[1]("new-value");
      });
    }).not.toThrow();
  });

  it("does not throw when localStorage.setItem throws SecurityError", () => {
    const { result } = renderHook(() => useLocalStorage<string>("key", "init"));

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });

    expect(() => {
      act(() => {
        result.current[1]("new-value");
      });
    }).not.toThrow();
  });

  // Finding 4: removeValue memoization when initialValue is an object literal
  it("removeValue is stable across re-renders when initialValue is an object", () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount++;
      // New object reference each render — should NOT bust removeValue memo
      return useLocalStorage<{ x: number }>("obj-key", { x: 1 });
    });

    const firstRemoveValue = result.current[2];
    rerender();
    rerender();

    expect(renderCount).toBeGreaterThan(1);
    expect(result.current[2]).toBe(firstRemoveValue);
  });

  it("removeValue resets to the initial value captured on mount", () => {
    const { result } = renderHook(() => useLocalStorage<number>("num-key", 99));

    act(() => {
      result.current[1](200);
    });
    expect(result.current[0]).toBe(200);

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(99);
  });
});
