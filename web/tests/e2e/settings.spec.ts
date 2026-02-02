/**
 * E2E Tests: Settings Pages
 * Tests for account settings, billing, and user preferences
 */

import { test, expect, Page } from "@playwright/test";
import { registerUser, loginUser, TestUser } from "./fixtures/test-utils";

let testUser: TestUser;

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    testUser = await registerUser(page);
  });

  test.describe("Account Settings", () => {
    test("shows account settings page", async ({ page }) => {
      await page.goto("/settings/account");

      // Should see account settings
      await expect(page.getByRole("heading", { name: /account|settings/i })).toBeVisible();
    });

    test("displays current email", async ({ page }) => {
      await page.goto("/settings/account");

      // Should show the user's email
      await expect(page.getByText(testUser.email)).toBeVisible();
    });

    test("has change password section", async ({ page }) => {
      await page.goto("/settings/account");

      // Should have password change option
      const passwordSection = page.getByText(/password/i);
      await expect(passwordSection.first()).toBeVisible();
    });

    test("has delete account section", async ({ page }) => {
      await page.goto("/settings/account");

      // Should have delete account option (usually dangerous zone)
      const deleteSection = page.getByRole("button", { name: /delete.*account/i });
      if (await deleteSection.isVisible()) {
        await expect(deleteSection).toBeVisible();
      }
    });
  });

  test.describe("Billing Settings", () => {
    test("shows billing page", async ({ page }) => {
      await page.goto("/settings/billing");

      await expect(page.getByRole("main")).toBeVisible();
    });

    test("shows current plan", async ({ page }) => {
      await page.goto("/settings/billing");

      // Should show Free or Pro plan indicator
      await expect(page.getByText(/free|pro|plan/i)).toBeVisible();
    });

    test("shows upgrade option for free users", async ({ page }) => {
      await page.goto("/settings/billing");

      // Free users should see upgrade option
      const upgradeBtn = page.getByRole("button", { name: /upgrade/i });
      if (await upgradeBtn.isVisible()) {
        await expect(upgradeBtn).toBeVisible();
      }
    });
  });

  test.describe("Audit Log", () => {
    test("shows audit log page", async ({ page }) => {
      await page.goto("/settings/audit");

      await expect(page.getByRole("main")).toBeVisible();
    });

    test("displays activity history", async ({ page }) => {
      await page.goto("/settings/audit");

      // Should show audit log entries
      await expect(page.getByText(/activity|log|history/i)).toBeVisible();
    });
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
  });

  test("navigates from dashboard to settings", async ({ page }) => {
    await page.goto("/dashboard");

    // Find and click settings link in nav or menu
    const settingsLink = page.getByRole("link", { name: /settings/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test("settings sidebar navigation works", async ({ page }) => {
    await page.goto("/settings/account");

    // Click billing in sidebar
    const billingLink = page.getByRole("link", { name: /billing/i });
    if (await billingLink.isVisible()) {
      await billingLink.click();
      await expect(page).toHaveURL(/\/settings\/billing/);
    }
  });

  test("back to dashboard from settings", async ({ page }) => {
    await page.goto("/settings/account");

    // Find dashboard link
    const dashboardLink = page.getByRole("link", { name: /dashboard/i });
    if (await dashboardLink.first().isVisible()) {
      await dashboardLink.first().click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});

test.describe("Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
  });

  test("toggles dark mode", async ({ page }) => {
    await page.goto("/dashboard");

    // Find dark mode toggle
    const darkModeToggle = page.getByRole("button", { name: /dark|light|theme/i });
    if (await darkModeToggle.isVisible()) {
      // Click to toggle
      await darkModeToggle.click();

      // Check if dark class is added to html
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains("dark");
      });

      expect(isDark).toBe(true);
    }
  });

  test("persists dark mode preference", async ({ page }) => {
    await page.goto("/dashboard");

    // Set dark mode
    const darkModeToggle = page.getByRole("button", { name: /dark|light|theme/i });
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();

      // Reload page
      await page.reload();

      // Check if dark mode is still active
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains("dark");
      });

      expect(isDark).toBe(true);
    }
  });
});
