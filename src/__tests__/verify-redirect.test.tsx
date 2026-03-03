import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("?status=success"),
}));

vi.mock("@/components/auth/auth-shell", () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/auth/resend-verification-button", () => ({
  ResendVerificationButton: () => null,
}));

import VerifyPage from "@/app/auth/verify/page";

describe("VerifyPage success redirect", () => {
  it("redirects to /onboarding on success", () => {
    vi.useFakeTimers();
    render(<VerifyPage />);

    // Tick 3 times (3→2→1→0, redirect fires at 0)
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);

    expect(mockPush).toHaveBeenCalledWith("/onboarding");
    vi.useRealTimers();
  });
});
