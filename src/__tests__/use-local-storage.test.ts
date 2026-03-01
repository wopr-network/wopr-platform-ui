import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "../hooks/use-local-storage";

describe("useLocalStorage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the initial value on first render", () => {
    const { result } = renderHook(() => useLocalStorage("key", "initial"));
    expect(result.current[0]).toBe("initial");
  });

  it("reads an existing localStorage value on mount", () => {
    localStorage.setItem("existing", JSON.stringify("persisted"));
    const { result } = renderHook(() => useLocalStorage("existing", "default"));
    expect(result.current[0]).toBe("persisted");
  });

  it("setValue updates state and persists to localStorage", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useLocalStorage("key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(setItemSpy).toHaveBeenCalledWith("key", JSON.stringify("updated"));
  });

  it("setValue accepts an updater function", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem("count")).toBe("1");
  });

  it("removeValue clears localStorage and resets to initial value", () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");
    const { result } = renderHook(() => useLocalStorage("key", "initial"));

    act(() => {
      result.current[1]("something");
    });
    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("initial");
    expect(removeItemSpy).toHaveBeenCalledWith("key");
  });
});
