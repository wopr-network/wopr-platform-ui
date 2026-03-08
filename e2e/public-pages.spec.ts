import { expect, test } from "@playwright/test";

test.describe("Public Pages", () => {
	test("pricing page renders tier cards and CTA links to /signup", async ({ page }) => {
		// Mock the public pricing API so the page doesn't depend on a live backend
		await page.route("**/api/pricing**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ rates: [] }),
			});
		});

		await page.goto("/pricing", { waitUntil: "domcontentloaded" });

		// Main heading
		await expect(page.getByText(/WOPR pays for itself/i).first()).toBeVisible({
			timeout: 10000,
		});

		// Pricing card (bot price tier)
		await expect(page.getByText("WOPR Bot").first()).toBeVisible();

		// CTA links point to /signup
		const signupLinks = page.getByRole("link", { name: /get started/i });
		await expect(signupLinks.first()).toBeVisible();
		const href = await signupLinks.first().getAttribute("href");
		expect(href).toContain("/signup");
	});

	test("status page renders health indicators without error", async ({ page }) => {
		// Mock the health endpoint so the page resolves without a live backend
		await page.route("**/api/health**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					status: "healthy",
					services: {
						api: "healthy",
						database: "healthy",
						queue: "healthy",
					},
				}),
			});
		});

		await page.goto("/status", { waitUntil: "domcontentloaded" });

		// Page heading
		await expect(page.getByRole("heading", { name: /Platform Status/i }).first()).toBeVisible({
			timeout: 10000,
		});

		// Sub-heading / description
		await expect(page.getByText(/Real-time health/i).first()).toBeVisible();

		// No error banner visible
		await expect(
			page.getByText(/Unable to reach the WOPR platform/i).first(),
		).not.toBeVisible();
	});

	test("privacy page renders with content, not blank", async ({ page }) => {
		await page.goto("/privacy", { waitUntil: "domcontentloaded" });

		// Page heading
		await expect(page.getByRole("heading", { name: /Privacy Policy/i }).first()).toBeVisible({
			timeout: 10000,
		});

		// Has a last-updated date line
		await expect(page.getByText(/Last updated/i).first()).toBeVisible();

		// Has a table of contents / navigable section
		await expect(page.getByText(/Contents/i).first()).toBeVisible();
	});

	test("terms page renders with content, not blank", async ({ page }) => {
		await page.goto("/terms", { waitUntil: "domcontentloaded" });

		// Page heading — accept either "Terms of Service" or "Terms & Conditions"
		await expect(
			page.getByRole("heading", { name: /Terms/i }).first(),
		).toBeVisible({ timeout: 10000 });

		// Has a last-updated date line
		await expect(page.getByText(/Last updated/i).first()).toBeVisible();
	});
});
