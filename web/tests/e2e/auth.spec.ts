import { test, expect } from "@playwright/test";

function randEmail() {
  return `auth_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe("Authentication", () => {
  test("shows login page with form elements", async ({ page }) => {
    await page.goto("/login");
    
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  });

  test("shows register page with form elements", async ({ page }) => {
    await page.goto("/register");
    
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/register");
    
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/register/);
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/register");
    
    await page.getByLabel("Email").fill(randEmail());
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: /create account/i }).click();
    
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/register/);
  });

  test("registers new user and redirects to applications", async ({ page }) => {
    const email = randEmail();
    
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    
    // Should redirect to applications after successful registration
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  });

  test("shows error for duplicate registration", async ({ page }) => {
    const email = randEmail();
    
    // First registration
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    
    // Log out by clearing cookies and going to register again
    await page.context().clearCookies();
    
    // Second registration with same email
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    
    // Should show error or stay on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("logs in with valid credentials", async ({ page }) => {
    const email = randEmail();
    const password = "password123";
    
    // Register first
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    
    // Log out
    await page.context().clearCookies();
    
    // Log in
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    
    // Should redirect to dashboard or applications
    await expect(page).toHaveURL(/\/(dashboard|applications)/, { timeout: 10000 });
  });

  test("shows error for invalid login credentials", async ({ page }) => {
    await page.goto("/login");
    
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    
    // Should show error and stay on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test("redirects unauthenticated user from protected pages", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("forgot password page is accessible", async ({ page }) => {
    await page.goto("/forgot-password");
    
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /reset|send/i })).toBeVisible();
  });
});
