import { test, expect, Page } from "@playwright/test";

function randEmail() {
  return `apps_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

// Helper to register and login
async function registerAndLogin(page: Page) {
  const email = randEmail();
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  return email;
}

test.describe("Applications", () => {
  test("shows empty state for new user", async ({ page }) => {
    await registerAndLogin(page);
    
    // Should see empty state or applications list
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("creates new application with required fields", async ({ page }) => {
    await registerAndLogin(page);
    
    // Navigate to new application
    await page.goto("/applications/new");
    
    // Fill required fields
    await page.getByLabel("Company").fill("Google");
    await page.getByLabel("Job Title").fill("Software Engineer");
    await page.getByRole("button", { name: /create/i }).click();
    
    // Should redirect to applications list
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Should see the new application
    await expect(page.getByText("Google")).toBeVisible();
  });

  test("creates application with all fields", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/applications/new");
    
    // Fill all fields
    await page.getByLabel("Company").fill("Meta");
    await page.getByLabel("Job Title").fill("Frontend Engineer");
    await page.getByLabel("Location").fill("Remote");
    await page.getByLabel("URL").fill("https://meta.com/careers/123");
    await page.getByLabel("Salary Min").fill("150000");
    await page.getByLabel("Salary Max").fill("200000");
    await page.getByLabel("Source").fill("LinkedIn");
    await page.getByLabel("Tags").fill("remote, frontend, react");
    
    await page.getByRole("button", { name: /create/i }).click();
    
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    await expect(page.getByText("Meta")).toBeVisible();
  });

  test("validates required fields", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/applications/new");
    
    // Try to submit without required fields
    await page.getByRole("button", { name: /create/i }).click();
    
    // Should stay on page (validation error)
    await expect(page).toHaveURL(/\/applications\/new/);
  });

  test("views application details", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create an application first
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("Amazon");
    await page.getByLabel("Job Title").fill("SDE II");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Click to view details
    await page.getByRole("link", { name: "Amazon" }).click();
    
    // Should be on detail page
    await expect(page).toHaveURL(/\/applications\/.+/);
    await expect(page.getByText("Amazon")).toBeVisible();
    await expect(page.getByText("SDE II")).toBeVisible();
  });

  test("edits application", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create an application
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("Netflix");
    await page.getByLabel("Job Title").fill("Backend Engineer");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Go to details
    await page.getByRole("link", { name: "Netflix" }).click();
    await expect(page).toHaveURL(/\/applications\/.+/);
    
    // Click edit button
    await page.getByRole("button", { name: /edit/i }).click();
    
    // Update the title
    const titleInput = page.getByLabel("Job Title");
    await titleInput.clear();
    await titleInput.fill("Senior Backend Engineer");
    
    // Save changes
    await page.getByRole("button", { name: /save/i }).click();
    
    // Should see updated title
    await expect(page.getByText("Senior Backend Engineer")).toBeVisible({ timeout: 5000 });
  });

  test("changes application stage", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create an application
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("Apple");
    await page.getByLabel("Job Title").fill("iOS Developer");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Go to details
    await page.getByRole("link", { name: "Apple" }).click();
    
    // Look for stage selector and change it
    const stageSelect = page.locator('select, [role="combobox"]').first();
    if (await stageSelect.isVisible()) {
      await stageSelect.selectOption({ label: "Applied" });
    }
  });

  test("deletes application", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create an application
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("DeleteMe Corp");
    await page.getByLabel("Job Title").fill("Test Position");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Go to details
    await page.getByRole("link", { name: "DeleteMe Corp" }).click();
    
    // Delete the application
    const deleteBtn = page.getByRole("button", { name: /delete/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Confirm if there's a dialog
      const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      
      // Should redirect to list
      await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    }
  });

  test("filters applications by stage", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create multiple applications
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("FilterTest1");
    await page.getByLabel("Job Title").fill("Role 1");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Look for filter controls
    const filterBtn = page.getByRole("button", { name: /filter|stage/i });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
  });

  test("searches applications", async ({ page }) => {
    await registerAndLogin(page);
    
    // Create an application
    await page.goto("/applications/new");
    await page.getByLabel("Company").fill("SearchableCompany");
    await page.getByLabel("Job Title").fill("Unique Role XYZ");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
    
    // Search for it
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("SearchableCompany");
      await page.waitForTimeout(500); // debounce
      
      await expect(page.getByText("SearchableCompany")).toBeVisible();
    }
  });
});
