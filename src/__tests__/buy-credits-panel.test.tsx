import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock framer-motion to avoid animation issues
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

const mockGetCreditOptions = vi.fn();
const mockCreateCreditCheckout = vi.fn();

vi.mock("@/lib/api", () => ({
  getCreditOptions: (...args: unknown[]) => mockGetCreditOptions(...args),
  createCreditCheckout: (...args: unknown[]) => mockCreateCreditCheckout(...args),
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/validate-redirect-url", () => ({
  isAllowedRedirectUrl: () => true,
}));

import { BuyCreditsPanel } from "@/components/billing/buy-credits-panel";

describe("BuyCreditsPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows error message with retry button when API fails", async () => {
    mockGetCreditOptions.mockRejectedValueOnce(new Error("Network error"));

    render(<BuyCreditsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load credit packages.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows 'not available' message when API returns empty array", async () => {
    mockGetCreditOptions.mockResolvedValueOnce([]);

    render(<BuyCreditsPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Credit purchases are not available at this time."),
      ).toBeInTheDocument();
    });
    // Should NOT show retry button for intentionally empty tiers
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("retries loading when retry button is clicked", async () => {
    const user = userEvent.setup();
    mockGetCreditOptions
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce([{ priceId: "price_1", label: "$10", bonusPercent: 0 }]);

    render(<BuyCreditsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load credit packages.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByText("$10")).toBeInTheDocument();
    });
    expect(mockGetCreditOptions).toHaveBeenCalledTimes(2);
  });

  it("renders tier buttons when API returns tiers", async () => {
    mockGetCreditOptions.mockResolvedValueOnce([
      { priceId: "price_1", label: "$10", bonusPercent: 0 },
      { priceId: "price_2", label: "$50", bonusPercent: 10 },
    ]);

    render(<BuyCreditsPanel />);

    await waitFor(() => {
      expect(screen.getByText("$10")).toBeInTheDocument();
    });
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText("+10%")).toBeInTheDocument();
  });
});
