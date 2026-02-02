/**
 * E2E Test Utilities
 * Shared fixtures and helpers for Playwright tests
 */

import { Page, expect } from "@playwright/test";

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}@example.com`;
}

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
}

/**
 * Register a new test user and verify redirect
 */
export async function registerUser(page: Page, user?: Partial<TestUser>): Promise<TestUser> {
  const testUser: TestUser = {
    email: user?.email || generateTestEmail("reg"),
    password: user?.password || "TestPassword123!",
  };

  await page.goto("/register");
  await page.getByLabel("Email").fill(testUser.email);
  await page.getByLabel("Password").fill(testUser.password);
  await page.getByRole("button", { name: /create account/i }).click();

  // Wait for redirect to applications
  await expect(page).toHaveURL(/\/applications/, { timeout: 15000 });

  return testUser;
}

/**
 * Login with existing user credentials
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard or applications
  await expect(page).toHaveURL(/\/(dashboard|applications)/, { timeout: 15000 });
}

/**
 * Logout current user by clearing cookies
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * Application data for creating test applications
 */
export interface TestApplication {
  company: string;
  title: string;
  location?: string;
  url?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string;
  source?: string;
}

/**
 * Create a new job application
 */
export async function createApplication(
  page: Page,
  app: Partial<TestApplication> = {}
): Promise<string> {
  const testApp: TestApplication = {
    company: app.company || `TestCompany_${Date.now()}`,
    title: app.title || "Software Engineer",
    ...app,
  };

  await page.goto("/applications/new");

  // Fill required fields
  await page.getByLabel("Company").fill(testApp.company);
  await page.getByLabel("Job Title").fill(testApp.title);

  // Fill optional fields if provided
  if (testApp.location) {
    await page.getByLabel("Location").fill(testApp.location);
  }
  if (testApp.url) {
    await page.getByLabel("URL").fill(testApp.url);
  }
  if (testApp.salaryMin) {
    await page.getByLabel("Salary Min").fill(testApp.salaryMin.toString());
  }
  if (testApp.salaryMax) {
    await page.getByLabel("Salary Max").fill(testApp.salaryMax.toString());
  }
  if (testApp.tags) {
    await page.getByLabel("Tags").fill(testApp.tags);
  }
  if (testApp.source) {
    await page.getByLabel("Source").fill(testApp.source);
  }

  await page.getByRole("button", { name: /create/i }).click();

  // Wait for redirect to applications list
  await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });

  // Verify application appears in list
  await expect(page.getByText(testApp.company)).toBeVisible();

  return testApp.company;
}

/**
 * Navigate to application detail page
 */
export async function goToApplicationDetail(page: Page, company: string): Promise<void> {
  await page.getByRole("link", { name: company }).click();
  await expect(page).toHaveURL(/\/applications\/.+/);
  await expect(page.getByText(company)).toBeVisible();
}

/**
 * Add a task to the current application
 */
export async function addTask(page: Page, title: string): Promise<void> {
  const taskInput = page.getByPlaceholder(/add.*task/i);
  await taskInput.fill(title);
  await page.getByRole("button", { name: /add task/i }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
}

/**
 * Add a note to the current application
 */
export async function addNote(page: Page, content: string): Promise<void> {
  const noteInput = page.getByPlaceholder(/add.*note|write.*note/i);
  if (await noteInput.isVisible()) {
    await noteInput.fill(content);
    await page.getByRole("button", { name: /add note|save/i }).click();
    await expect(page.getByText(content.slice(0, 30))).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Wait for API response (useful for debugging)
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      if (typeof urlPattern === "string") {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    },
    { timeout }
  );
}

/**
 * Take screenshot for debugging
 */
export async function debugScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `./test-results/debug-${name}-${Date.now()}.png` });
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Application stages
 */
export const APPLICATION_STAGES = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

/**
 * Change application stage
 */
export async function changeApplicationStage(
  page: Page,
  newStage: ApplicationStage
): Promise<void> {
  const stageSelect = page.locator('select, [role="combobox"]').first();
  if (await stageSelect.isVisible()) {
    await stageSelect.selectOption({ label: newStage });
    // Wait for the update
    await page.waitForTimeout(1000);
  }
}
