import { expect, test } from "./fixtures/auth";
import { createSettingsMockState, mockSettingsAPI } from "./fixtures/settings";

test.describe("Settings: Profile", () => {
  test("loads and can update display name", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/profile");

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText("Personal Information")).toBeVisible();

    // Form is populated with mock data
    const nameInput = page.locator("#profile-name");
    await expect(nameInput).toHaveValue("E2E Test User");

    const emailInput = page.locator("#profile-email");
    await expect(emailInput).toHaveValue("e2e@wopr.test");

    // Change display name
    await nameInput.clear();
    await nameInput.fill("Updated Name");
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify success message
    await expect(page.getByText("Profile updated.")).toBeVisible();
    expect(state.profile.name).toBe("Updated Name");
  });

  test("change password form shows success message", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/profile");

    await expect(page.getByText("Change Password")).toBeVisible();

    await page.locator("#current-password").fill("OldPassword123!");
    await page.locator("#new-password").fill("NewPassword456!");
    await page.locator("#confirm-new-password").fill("NewPassword456!");

    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Password changed.")).toBeVisible();
  });

  test("connected accounts section renders OAuth providers", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/profile");

    await expect(page.getByText("Connected Accounts")).toBeVisible();
    // Providers are rendered as capitalized text
    await expect(page.getByText("github")).toBeVisible();
    await expect(page.getByText("discord")).toBeVisible();
    await expect(page.getByText("google")).toBeVisible();
  });

  test("delete account dialog requires confirmation text", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/profile");

    await page.getByRole("button", { name: "Delete account" }).click();

    // Dialog opens
    await expect(page.getByText("Are you absolutely sure?")).toBeVisible();

    // Delete button should be disabled without confirmation text
    await expect(page.getByRole("button", { name: "Delete permanently" })).toBeDisabled();

    // Type confirmation
    await page.getByPlaceholder("delete my account").fill("delete my account");

    // Delete button should now be enabled
    await expect(page.getByRole("button", { name: "Delete permanently" })).toBeEnabled();
  });
});

test.describe("Settings: Account", () => {
  test("loads and shows current plan", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/account");

    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText("Current Plan")).toBeVisible();
    // getBillingUsage calls billing.currentPlan which returns { tier: "free" }
    // planName = "Free" (capitalized)
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage Billing" })).toBeVisible();
  });

  test("teams and organizations section renders", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/account");

    await expect(page.getByText("Teams & Organizations")).toBeVisible();
  });
});

test.describe("Settings: Security", () => {
  test("loads with 2FA section and sessions", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/security");

    await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();

    // 2FA section
    await expect(page.getByText("Two-Factor Authentication")).toBeVisible();
    await expect(page.getByText("Two-factor authentication is not enabled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enable 2FA" })).toBeVisible();

    // Sessions section
    await expect(page.getByText("Active Sessions")).toBeVisible();
    // Current session shows "This device"
    await expect(page.getByText("This device")).toBeVisible();
  });

  test("login history section renders", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/security");

    await expect(page.getByText("Login History")).toBeVisible();
    // Should show total count from mock
    await expect(page.getByText("1 total events")).toBeVisible();
  });
});

test.describe("Settings: API Keys", () => {
  test("loads and can create a key", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/api-keys");

    await expect(page.getByRole("heading", { name: "API Keys" })).toBeVisible();
    await expect(page.getByText("No API keys yet")).toBeVisible();

    // Create a key
    await page.getByRole("button", { name: "Generate new key" }).click();

    // Dialog opens
    await expect(page.getByText("Generate API Key")).toBeVisible();

    // Fill form
    await page.locator("#key-name").fill("CI Pipeline");

    await page.getByRole("button", { name: "Generate key" }).click();

    // Key secret should be shown
    await expect(page.getByText("Your new API key has been created")).toBeVisible();
    await expect(page.getByText(/wopr_test_/)).toBeVisible();

    // Dismiss the secret banner
    await page.getByRole("button", { name: "Dismiss" }).click();

    // Key should appear in the table
    await expect(page.getByText("CI Pipeline")).toBeVisible();

    // Verify state was mutated
    expect(state.apiKeys.length).toBe(1);
    expect(state.apiKeys[0].name).toBe("CI Pipeline");
  });

  test("can revoke a key", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    // Pre-populate with a key
    state.apiKeys.push({
      id: "existing-key",
      name: "Old Key",
      prefix: "wopr_",
      scope: "full",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: null,
    });
    await mockSettingsAPI(page, state);

    await page.goto("/settings/api-keys");

    await expect(page.getByText("Old Key")).toBeVisible();

    // Revoke the key
    await page.getByRole("button", { name: "Revoke" }).click();

    // Confirm revoke dialog
    await expect(page.getByText("Revoke API Key")).toBeVisible();
    await page.getByRole("button", { name: "Revoke key" }).click();

    // Key should be removed
    await expect(page.getByText("No API keys yet")).toBeVisible();
  });
});

test.describe("Settings: Providers", () => {
  test("loads and shows capability routing", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/providers");

    await expect(page.getByRole("heading", { name: "Provider Settings" })).toBeVisible();

    // Capability cards should render (from tRPC capabilities.listCapabilityMeta mock)
    await expect(page.getByText("Text Generation")).toBeVisible();
    await expect(page.getByText("Transcription")).toBeVisible();

    // Provider keys section
    await expect(page.getByText("Provider Keys")).toBeVisible();
  });
});

test.describe("Settings: Brain", () => {
  test("loads and shows current model", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/brain");

    await expect(page.getByRole("heading", { name: "Brain" })).toBeVisible();
    await expect(page.getByText("Choose which AI model powers your WOPR")).toBeVisible();

    // Current model card should be visible
    await expect(page.getByTestId("current-model")).toBeVisible();

    // View mode buttons
    await expect(page.getByRole("button", { name: /Pick a model/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bring Your Own Key/ })).toBeVisible();

    // Hero models should be visible (from static onboarding-data)
    const modelCards = page.locator("[data-testid^='model-card-']");
    await expect(modelCards.first()).toBeVisible();
  });

  test("more models toggle expands additional models", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/brain");

    await expect(page.getByTestId("more-models-toggle")).toBeVisible();
    await page.getByTestId("more-models-toggle").click();

    // Additional models section should now be visible
    await expect(page.getByText(/models available/)).toBeVisible();
  });
});

test.describe("Settings: Notifications", () => {
  test("loads and can toggle a preference", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/notifications");

    await expect(page.getByText("Notifications")).toBeVisible();
    await expect(page.getByText("Control which system emails you receive")).toBeVisible();

    // Preference groups should render
    await expect(page.getByText("Billing")).toBeVisible();
    await expect(page.getByText("Agents")).toBeVisible();

    // Toggle a preference -- "Low balance alerts" switch should be checked initially
    const lowBalanceToggle = page.getByRole("switch", {
      name: "Low balance alerts",
    });
    await expect(lowBalanceToggle).toBeVisible();
    await expect(lowBalanceToggle).toBeChecked();

    // Toggle it off
    await lowBalanceToggle.click();

    // Should see "Saved" indicator
    await expect(page.getByText("Saved")).toBeVisible();

    // State should be updated
    expect(state.notificationPrefs.billing_low_balance).toBe(false);
  });
});

test.describe("Settings: Organization", () => {
  test("loads and shows members", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/org");

    await expect(page.getByRole("heading", { name: "Organization" })).toBeVisible();
    await expect(page.getByText("Organization Details")).toBeVisible();

    // Org form should be populated
    const nameInput = page.locator("#org-name");
    await expect(nameInput).toHaveValue("E2E Test Org");

    // Members section
    await expect(page.getByText("Members")).toBeVisible();
    await expect(page.getByText("2 members")).toBeVisible();
    await expect(page.getByText("E2E Test User")).toBeVisible();
    await expect(page.getByText("Team Member")).toBeVisible();
  });

  test("can invite a member", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/org");

    await page.getByRole("button", { name: "Invite member" }).click();

    // Dialog opens
    await expect(page.getByText("Invite Member")).toBeVisible();

    // Fill email
    await page.locator("#invite-email").fill("newmember@wopr.test");

    // Submit
    await page.getByRole("button", { name: "Send invitation" }).click();

    // Invite should be added to state
    expect(state.org.invites.length).toBe(1);
    expect(state.org.invites[0].email).toBe("newmember@wopr.test");
  });
});

test.describe("Settings: Activity", () => {
  test("loads and shows audit events", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/activity");

    await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
    await expect(page.getByText("Events")).toBeVisible();
    await expect(page.getByText("3 total events")).toBeVisible();

    // Events should render in the table (humanAction converts "profile.update" to "Profile Update")
    await expect(page.getByText("Profile Update")).toBeVisible();
    await expect(page.getByText("Api Key Create")).toBeVisible();
    await expect(page.getByText("Security Password Change")).toBeVisible();

    // Search input should be visible
    await expect(page.getByPlaceholder("Search...")).toBeVisible();
  });

  test("search filters events client-side", async ({ authedPage: page }) => {
    const state = createSettingsMockState();
    await mockSettingsAPI(page, state);

    await page.goto("/settings/activity");

    await expect(page.getByText("3 total events")).toBeVisible();

    // Search for "profile"
    await page.getByPlaceholder("Search...").fill("profile");

    // Only profile event should be visible
    await expect(page.getByText("Profile Update")).toBeVisible();
    await expect(page.getByText("Api Key Create")).not.toBeVisible();
  });
});
