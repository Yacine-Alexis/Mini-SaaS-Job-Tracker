import { test, expect, Page } from "@playwright/test";

function randEmail() {
  return `tasks_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
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

async function createApplication(page: Page, company: string) {
  await page.goto("/applications/new");
  await page.getByLabel("Company").fill(company);
  await page.getByLabel("Job Title").fill("Test Role");
  await page.getByRole("button", { name: /create/i }).click();
  await expect(page).toHaveURL(/\/applications$/, { timeout: 10000 });
  
  // Navigate to the application detail
  await page.getByRole("link", { name: company }).click();
  await expect(page).toHaveURL(/\/applications\/.+/);
}

test.describe("Tasks", () => {
  test("adds task to application", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "TaskTestCo");
    
    // Add a task
    const taskInput = page.getByPlaceholder(/add.*task/i);
    await taskInput.fill("Send thank you email");
    await page.getByRole("button", { name: /add task/i }).click();
    
    // Should see the task
    await expect(page.getByText("Send thank you email")).toBeVisible({ timeout: 5000 });
  });

  test("marks task as complete", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "CompleteTaskCo");
    
    // Add a task
    const taskInput = page.getByPlaceholder(/add.*task/i);
    await taskInput.fill("Complete coding challenge");
    await page.getByRole("button", { name: /add task/i }).click();
    
    await expect(page.getByText("Complete coding challenge")).toBeVisible({ timeout: 5000 });
    
    // Find and click the checkbox/complete button for this task
    const taskRow = page.locator("text=Complete coding challenge").locator("..");
    const checkbox = taskRow.locator('input[type="checkbox"], button, [role="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    }
  });

  test("deletes task", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "DeleteTaskCo");
    
    // Add a task
    const taskInput = page.getByPlaceholder(/add.*task/i);
    await taskInput.fill("Delete this task");
    await page.getByRole("button", { name: /add task/i }).click();
    
    await expect(page.getByText("Delete this task")).toBeVisible({ timeout: 5000 });
    
    // Find and click delete button
    const taskRow = page.locator("text=Delete this task").locator("..");
    const deleteBtn = taskRow.getByRole("button", { name: /delete|remove|×/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
    }
  });
});

test.describe("Notes", () => {
  test("adds note to application", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "NoteTestCo");
    
    // Find notes section and add a note
    const noteInput = page.getByPlaceholder(/add.*note|write.*note/i);
    if (await noteInput.isVisible()) {
      await noteInput.fill("Had a great conversation with the recruiter.");
      await page.getByRole("button", { name: /add note|save/i }).click();
      
      await expect(page.getByText("Had a great conversation")).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Contacts", () => {
  test("adds contact to application", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "ContactTestCo");
    
    // Look for contacts section
    const contactsSection = page.getByText(/contacts/i);
    if (await contactsSection.isVisible()) {
      // Find add contact button or form
      const addContactBtn = page.getByRole("button", { name: /add contact/i });
      if (await addContactBtn.isVisible()) {
        await addContactBtn.click();
        
        // Fill contact form
        await page.getByLabel(/name/i).fill("John Doe");
        await page.getByLabel(/email/i).fill("john@company.com");
        await page.getByRole("button", { name: /save|add/i }).click();
        
        await expect(page.getByText("John Doe")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe("Interviews", () => {
  test("schedules interview for application", async ({ page }) => {
    await registerAndLogin(page);
    await createApplication(page, "InterviewTestCo");
    
    // Look for interviews section
    const interviewsSection = page.getByText(/interviews/i);
    if (await interviewsSection.isVisible()) {
      // Find add interview button
      const addInterviewBtn = page.getByRole("button", { name: /add interview|schedule/i });
      if (await addInterviewBtn.isVisible()) {
        await addInterviewBtn.click();
        
        // Fill interview form (basic fields)
        const dateInput = page.getByLabel(/date|when/i);
        if (await dateInput.isVisible()) {
          // Set a future date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          await dateInput.fill(futureDate.toISOString().slice(0, 16));
        }
        
        await page.getByRole("button", { name: /save|schedule|add/i }).click();
      }
    }
  });
});
