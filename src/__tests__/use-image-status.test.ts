import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImageStatus } from "@/hooks/use-image-status";

vi.mock("@/lib/api", () => ({
  getImageStatus: vi.fn(),
}));

import { getImageStatus } from "@/lib/api";

const mockGetImageStatus = vi.mocked(getImageStatus);

describe("useImageStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error: null on success", async () => {
    mockGetImageStatus.mockResolvedValue({
      updateAvailable: true,
      currentDigest: "sha256:abc",
      latestDigest: "sha256:def",
    });
    const { result } = renderHook(() => useImageStatus("inst-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.updateAvailable).toBe(true);
  });

  it("sets error on fetch failure", async () => {
    mockGetImageStatus.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useImageStatus("inst-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
    expect(result.current.updateAvailable).toBe(false);
  });

  it("clears error on successful retry after failure", async () => {
    mockGetImageStatus.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useImageStatus("inst-1"));
    await waitFor(() => expect(result.current.error).toBe("fail"));

    mockGetImageStatus.mockResolvedValue({
      updateAvailable: false,
      currentDigest: "sha256:abc",
      latestDigest: "sha256:abc",
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeNull();
  });

  it("handles non-Error thrown values", async () => {
    mockGetImageStatus.mockRejectedValue("string error");
    const { result } = renderHook(() => useImageStatus("inst-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("string error");
  });

  it("returns error: null when id is null", () => {
    const { result } = renderHook(() => useImageStatus(null));
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
