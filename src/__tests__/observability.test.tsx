import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

// Polyfill ResizeObserver for Radix Select (LogsViewer uses Select component)
if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe() {
      /* no-op stub */
    }
    unobserve() {
      /* no-op stub */
    }
    disconnect() {
      /* no-op stub */
    }
  }
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}

// Mock recharts to avoid canvas/SVG issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

vi.mock("@core/lib/api", () => ({
  getInstanceLogs: vi.fn(),
  getInstanceMetrics: vi.fn(),
}));

import { LogsViewer } from "@core/components/observability/logs-viewer";
import { MetricsDashboard } from "@core/components/observability/metrics-dashboard";
import { getInstanceLogs, getInstanceMetrics } from "@core/lib/api";

describe("LogsViewer", () => {
  it("shows loading skeleton before logs arrive", async () => {
    // Never resolve — keeps the component permanently in loading state
    vi.mocked(getInstanceLogs).mockReturnValue(
      new Promise((_resolve) => {
        /* never resolves — holds component in loading state */
      }),
    );

    render(<LogsViewer instanceId="inst-001" />);

    // Loading skeleton: bg-zinc-950 container with 12 Skeleton elements (class h-4 bg-zinc-800)
    const container = document.querySelector(".bg-zinc-950");
    expect(container).not.toBeNull();

    const skeletons = container?.querySelectorAll('[class*="h-4"]');
    expect(skeletons?.length).toBe(12);
  });

  it("shows empty state when API returns no logs", async () => {
    vi.mocked(getInstanceLogs).mockResolvedValue([]);

    render(<LogsViewer instanceId="inst-001" />);

    await waitFor(() => {
      expect(screen.queryByText("No logs match the current filters.")).not.toBeNull();
    });
    expect(
      screen.queryByText("Try broadening your search or changing the level filter."),
    ).not.toBeNull();
    // Entry count shows 0 entries
    expect(screen.queryByText("(0 entries)")).not.toBeNull();
  });
});

describe("MetricsDashboard", () => {
  it("shows loading skeleton before metrics arrive", async () => {
    // Never resolve — keeps the component permanently in loading state
    vi.mocked(getInstanceMetrics).mockReturnValue(
      new Promise((_resolve) => {
        /* never resolves — holds component in loading state */
      }),
    );

    render(<MetricsDashboard instanceId="inst-001" />);

    // Loading skeleton: 4 cards, each with h-4 w-24 (title) and h-32 w-full (chart area)
    const titleSkeletons = document.querySelectorAll('[class*="h-4"][class*="w-24"]');
    expect(titleSkeletons.length).toBe(4);

    const chartSkeletons = document.querySelectorAll('[class*="h-32"][class*="w-full"]');
    expect(chartSkeletons.length).toBe(4);
  });
});
