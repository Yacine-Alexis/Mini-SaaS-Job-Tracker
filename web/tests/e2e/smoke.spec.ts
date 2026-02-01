import { test, expect } from "@playwright/test";

function randEmail() {
  const n = Math.floor(Math.random() * 1_000_000);
  return `test${Date.now()}_${n}@example.com`;
}

test("smoke: register, create application, add task", async ({ page }) => {
  const email = randEmail();
  const password = "password123";

  // Register
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // lands in /applications via auto sign-in
  await expect(page).toHaveURL(/\/applications/);

  // Create application
  await page.getByRole("main").getByRole("link", { name: "New" }).click();
  await expect(page).toHaveURL(/\/applications\/new/);

  await page.getByLabel("Company").fill("Acme Inc");
  await page.getByLabel("Job Title").fill("Junior Dev");
  await page.getByLabel("Tags").fill("remote, referral");
  await page.getByRole("button", { name: "Create Application" }).click();

  await expect(page).toHaveURL(/\/applications/);

  // Open details
  await page.getByRole("link", { name: "Acme Inc" }).click();
  await expect(page).toHaveURL(/\/applications\/.+/);

  // Add task
  await page.getByPlaceholder("Add a task…").fill("Follow up email");
  await page.getByRole("button", { name: "Add task" }).click();

  await expect(page.getByText("Follow up email")).toBeVisible();
});
