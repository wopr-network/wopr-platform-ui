import { expect, test } from "./fixtures/auth";

/**
 * Full Stripe Checkout e2e tests.
 *
 * These tests drive real Stripe Checkout in test mode. They require:
 * - Platform backend running on port 3001 with real Stripe test-mode keys
 * - UI running on port 3000
 * - STRIPE_PUBLISHABLE_KEY env var set (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
 *
 * Skip when keys are not configured.
 */

const HAS_STRIPE_KEYS = !!(
	process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

/**
 * Helper: read the current credit balance from the credits page.
 * Parses the dollar amount from the Credit Balance card's large text.
 * Returns balance in dollars (e.g. 50.00).
 */
async function readCreditBalance(page: import("@playwright/test").Page): Promise<number> {
	await page.goto("/billing/credits");
	await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible({ timeout: 15000 });
	await expect(page.getByText("Credit Balance").first()).toBeVisible({ timeout: 10000 });

	// The balance is rendered as "$XX.XX" inside a div with class text-4xl font-bold font-mono.
	// Wait for the count-up animation to settle (it takes ~1.2s).
	await page.waitForTimeout(2000);

	const balanceText = await page
		.locator(".text-4xl.font-bold.font-mono")
		.first()
		.textContent();

	if (!balanceText) throw new Error("Could not read credit balance text");
	// Parse "$150.00" -> 150.00
	const match = balanceText.match(/\$?([\d,]+\.?\d*)/);
	if (!match) throw new Error(`Could not parse balance from: ${balanceText}`);
	return Number.parseFloat(match[1].replace(/,/g, ""));
}

/**
 * Helper: navigate to credits page, select a tier, click Buy, arrive at Stripe Checkout.
 */
async function startCheckout(page: import("@playwright/test").Page): Promise<void> {
	await page.goto("/billing/credits");
	await expect(page.getByText("Buy Credits")).toBeVisible({ timeout: 15000 });

	// Select the first available credit tier
	const firstTier = page.locator("button").filter({ hasText: /^\$\d+$/ }).first();
	await firstTier.click();

	// Click "Buy credits"
	await page.getByRole("button", { name: "Buy credits" }).click();

	// Wait for redirect to Stripe Checkout
	await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });
}

/**
 * Helper: fill Stripe Checkout form fields.
 * Handles optional fields (email, name, zip) that may or may not appear.
 */
async function fillStripeCard(
	page: import("@playwright/test").Page,
	cardNumber: string,
): Promise<void> {
	// Email field (may be pre-filled or hidden)
	const emailField = page.locator('input[name="email"]');
	if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
		await emailField.fill("e2e@wopr.test");
	}

	await page.locator('input[name="cardNumber"]').fill(cardNumber);
	await page.locator('input[name="cardExpiry"]').fill("12/30");
	await page.locator('input[name="cardCvc"]').fill("123");

	// Billing name (may not appear depending on Stripe config)
	const nameField = page.locator('input[name="billingName"]');
	if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
		await nameField.fill("E2E Test");
	}

	// Postal code (may not appear depending on country)
	const zipField = page.locator('input[name="billingPostalCode"]');
	if (await zipField.isVisible({ timeout: 1000 }).catch(() => false)) {
		await zipField.fill("10001");
	}
}

test.describe("Stripe Checkout: Full Flow", () => {
	test.skip(!HAS_STRIPE_KEYS, "Requires Stripe test-mode keys");

	// These tests are slow (real network calls to Stripe)
	test.setTimeout(120_000);

	test("1. happy path — purchase with test card, verify credit increase", async ({
		authedPage: page,
	}) => {
		// Read balance BEFORE purchase
		const balanceBefore = await readCreditBalance(page);

		// Start checkout
		await startCheckout(page);

		// Fill test card (4242 4242 4242 4242 = always succeeds)
		await fillStripeCard(page, "4242424242424242");

		// Submit payment
		await page.getByRole("button", { name: /Pay|Subscribe/i }).click();

		// Wait for redirect back to credits page with success
		await page.waitForURL(/\/billing\/credits\?checkout=success/, { timeout: 30000 });

		// Verify we're back on credits page
		await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible({ timeout: 15000 });

		// Read balance AFTER purchase — should have increased
		// Allow time for webhook to process and balance to update
		await page.waitForTimeout(3000);
		const balanceAfter = await readCreditBalance(page);

		expect(balanceAfter).toBeGreaterThan(balanceBefore);
	});

	test("2. declined card — verify error shown, no credits granted", async ({
		authedPage: page,
	}) => {
		// Read balance BEFORE
		const balanceBefore = await readCreditBalance(page);

		// Start checkout
		await startCheckout(page);

		// Fill declined test card (4000 0000 0000 0002 = always declines)
		await fillStripeCard(page, "4000000000000002");

		// Submit payment
		await page.getByRole("button", { name: /Pay|Subscribe/i }).click();

		// Stripe should show a decline error message on the checkout page
		// (does NOT redirect back — stays on Stripe Checkout with error)
		await expect(
			page.getByText(/declined|unable to process|not completed/i).first(),
		).toBeVisible({ timeout: 15000 });

		// Navigate back to credits page manually
		await page.goto("/billing/credits");
		await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible({ timeout: 15000 });

		// Balance should be unchanged
		await page.waitForTimeout(2000);
		const balanceAfter = await readCreditBalance(page);
		expect(balanceAfter).toBe(balanceBefore);
	});

	test("3. 3D Secure required — complete authentication, verify credits land", async ({
		authedPage: page,
	}) => {
		// Read balance BEFORE
		const balanceBefore = await readCreditBalance(page);

		// Start checkout
		await startCheckout(page);

		// Fill 3DS-required test card (4000 0025 0000 3155)
		await fillStripeCard(page, "4000002500003155");

		// Submit payment
		await page.getByRole("button", { name: /Pay|Subscribe/i }).click();

		// 3DS challenge appears — Stripe renders it in an iframe.
		// In test mode, Stripe shows a simple "Complete authentication" / "Authorize test payment" button.
		const challengeFrame = page.frameLocator(
			'iframe[name*="stripe-challenge"], iframe[src*="three-ds"]',
		);

		// Stripe test mode 3DS shows: "3D Secure 2 Test Page" with "Complete" and "Fail" buttons
		const completeBtn = challengeFrame.getByRole("button", { name: /Complete|Authorize/i });
		await expect(completeBtn).toBeVisible({ timeout: 20000 });
		await completeBtn.click();

		// After 3DS, Stripe completes payment and redirects back
		await page.waitForURL(/\/billing\/credits\?checkout=success/, { timeout: 30000 });

		await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible({ timeout: 15000 });

		// Verify balance increased
		await page.waitForTimeout(3000);
		const balanceAfter = await readCreditBalance(page);
		expect(balanceAfter).toBeGreaterThan(balanceBefore);
	});

	test("4. cancel mid-checkout — no credits granted", async ({ authedPage: page }) => {
		// Read balance BEFORE
		const balanceBefore = await readCreditBalance(page);

		// Start checkout
		await startCheckout(page);

		// We're on Stripe Checkout. Click the back/close link.
		// Stripe Checkout has a "< Back to {merchant}" link or an X button.
		const backLink = page.getByRole("link", { name: /back to/i });
		if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
			await backLink.click();
		} else {
			// Fallback: navigate directly to the cancel URL
			await page.goto("/billing/credits?checkout=cancel");
		}

		// Should be back on credits page (with ?checkout=cancel)
		await page.waitForURL(/\/billing\/credits/, { timeout: 15000 });
		await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible({ timeout: 15000 });

		// Balance unchanged
		await page.waitForTimeout(2000);
		const balanceAfter = await readCreditBalance(page);
		expect(balanceAfter).toBe(balanceBefore);
	});
});
