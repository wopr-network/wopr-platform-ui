import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsync } from "../hooks/use-async";

describe("useAsync", () => {
  // Finding 3: execute should be stable even when asyncFn changes reference each render
  it("execute is stable across re-renders even when asyncFn changes reference", async () => {
    let callCount = 0;
    const { result, rerender } = renderHook(() => {
      // Inline arrow function — new reference every render
      return useAsync(async () => {
        callCount++;
        return callCount;
      });
    });

    const firstExecute = result.current.execute;
    rerender();
    rerender();

    // execute should be referentially stable
    expect(result.current.execute).toBe(firstExecute);
  });

  it("execute always calls the latest asyncFn version", async () => {
    let version = 1;
    const { result, rerender } = renderHook(() => {
      const currentVersion = version;
      return useAsync(async () => currentVersion);
    });

    // Bump version and rerender — asyncFn now returns 2
    version = 2;
    rerender();

    await act(async () => {
      result.current.execute();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.data).toBe(2);
  });
});
