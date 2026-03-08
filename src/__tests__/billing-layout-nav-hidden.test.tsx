import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import BillingLayout from "@/app/(dashboard)/billing/layout";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/billing/plans",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock API — mode never resolves (stays null)
vi.mock("@/lib/api", () => ({
  getInferenceMode: () =>
    new Promise((_resolve) => {
      /* never resolves */
    }),
}));

test("hostedOnly nav item is hidden (not just invisible) while mode is loading", () => {
  render(
    <BillingLayout>
      <div>child</div>
    </BillingLayout>,
  );

  const hostedLink = screen.queryByText("Hosted Usage");
  // With "hidden" class, the element should not be in the document at all (display:none)
  // With "invisible" class, it WOULD be found but not visible — that's the bug
  if (hostedLink) {
    const li = hostedLink.closest("li");
    expect(li?.className).toMatch(/\bhidden\b/);
    expect(li?.className).not.toMatch(/\binvisible\b/);
  }
  // Either not rendered or has hidden class — both acceptable
});
