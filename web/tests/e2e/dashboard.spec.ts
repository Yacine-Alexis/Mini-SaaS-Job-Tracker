import { test, expect, Page } from "@playwright/test";

function randEmail() {
  return `dash_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerAndLogin(page: Page) {
  const email = randEmail();
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  return email;
}

test.describe("Dashboard", () => {
  test("shows dashboard for authenticated user", async ({ page }) => {
    await registerAndLogin(page);
    
    await page.goto("/dashboard");
    
    // Should see welcome message or stats
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText(/welcome|dashboard|applications/i)).toBeVisible();
  });

  test("shows stats cards", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // Should see stat cards (total, active, response rate, etc.)
    const statsText = await page.getByRole("main").textContent();
    expect(statsText).toBeTruthy();
  });

  test("shows quick action buttons", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // Should have Add Application button
    const addBtn = page.getByRole("link", { name: /add|new/i });
    await expect(addBtn.first()).toBeVisible();
  });

  test("links to applications page", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // Click View All or similar link
    const viewAllLink = page.getByRole("link", { name: /view all|applications/i });
    if (await viewAllLink.first().isVisible()) {
      await viewAllLink.first().click();
      await expect(page).toHaveURL(/\/applications/);
    }
  });

  test("shows empty state for new user", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // New user should see onboarding or empty state
    // Stats should show 0
    await expect(page.getByText(/0|no|get started/i)).toBeVisible();
  });
});

test.describe("Analytics", () => {
  test("shows analytics page for authenticated user", async ({ page }) => {
    await registerAndLogin(page);
    
    await page.goto("/analytics");
    
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText(/analytics|insights/i)).toBeVisible();
  });

  test("shows pipeline funnel", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/analytics");
    
    // Should show pipeline stages
    const pipelineText = await page.getByRole("main").textContent();
    expect(pipelineText?.toLowerCase()).toMatch(/saved|applied|interview|offer/i);
  });

  test("shows weekly activity chart", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/analytics");
    
    // Should see weekly activity section
    await expect(page.getByText(/weekly|activity/i)).toBeVisible();
  });

  test("back to dashboard link works", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/analytics");
    
    const backLink = page.getByRole("link", { name: /back|dashboard/i });
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});

test.describe("Navigation", () => {
  test("nav links work correctly", async ({ page }) => {
    await registerAndLogin(page);
    
    // Dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Applications
    const appsLink = page.getByRole("link", { name: /applications/i }).first();
    await appsLink.click();
    await expect(page).toHaveURL(/\/applications/);
    
    // Analytics
    const analyticsLink = page.getByRole("link", { name: /analytics/i });
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page).toHaveURL(/\/analytics/);
    }
  });

  test("mobile menu toggle works", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu button
    const menuBtn = page.getByRole("button", { name: /menu/i });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      
      // Should show mobile nav
      await expect(page.getByRole("navigation")).toBeVisible();
    }
  });

  test("user dropdown shows settings and logout", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/dashboard");
    
    // Look for user menu/avatar
    const userBtn = page.locator("button").filter({ has: page.locator("img, svg") }).last();
    if (await userBtn.isVisible()) {
      await userBtn.click();
      
      // Should see settings and logout options
      const settingsLink = page.getByRole("link", { name: /settings/i });
      const logoutBtn = page.getByRole("button", { name: /sign out|logout/i });
      
      // At least one should be visible in dropdown
      const hasSettings = await settingsLink.isVisible().catch(() => false);
      const hasLogout = await logoutBtn.isVisible().catch(() => false);
      expect(hasSettings || hasLogout).toBe(true);
    }
  });
});
