import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePluginSetupChat } from "@/hooks/use-plugin-setup-chat";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue(undefined),
  apiFetchRaw: vi.fn().mockResolvedValue({ body: null }),
}));

describe("usePluginSetupChat sendMessage stale closure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendMessage uses current pluginId, not stale closure value", async () => {
    const { apiFetch } = await import("@/lib/api");

    const { result } = renderHook(() => usePluginSetupChat());

    // Open setup with pluginId "plugin-A"
    act(() => {
      result.current.openSetup("plugin-A", "Plugin A", "bot-1");
    });

    // Send a message — should use "plugin-A"
    act(() => {
      result.current.sendMessage("hello");
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/chat/setup/message",
      expect.objectContaining({ method: "POST" }),
    );
    const firstCall = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string };
    const firstBody = JSON.parse(firstCall.body) as Record<string, unknown>;
    expect(firstBody.pluginId).toBe("plugin-A");
    expect(firstBody.botId).toBe("bot-1");
    expect(typeof firstBody.sessionId).toBe("string");
    expect(firstBody.text).toBe("hello");

    // Open setup again with a DIFFERENT pluginId "plugin-B"
    act(() => {
      result.current.openSetup("plugin-B", "Plugin B", "bot-2");
    });

    // Send another message — must use "plugin-B", not stale "plugin-A"
    act(() => {
      result.current.sendMessage("world");
    });

    const calls = (apiFetch as ReturnType<typeof vi.fn>).mock.calls;
    const lastCall = calls[calls.length - 1][1] as { body: string };
    const lastBody = JSON.parse(lastCall.body) as Record<string, unknown>;
    expect(lastBody.pluginId).toBe("plugin-B");
    expect(lastBody.botId).toBe("bot-2");
    expect(typeof lastBody.sessionId).toBe("string");
    expect(lastBody.text).toBe("world");
  });
});
