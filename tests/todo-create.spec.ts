import { test, expect } from '@playwright/test';
import { setupAuthUserMock, setupSupabaseRestMocks, setupIpifyMock } from './helpers/supabase-mocks';


test.describe('Create Todo', () => {
  test.beforeEach(async ({ page }) => {

    await setupAuthUserMock(page);
    await setupSupabaseRestMocks(page);
    await setupIpifyMock(page);

    // Block or stub external Gemini API calls to ensure deterministic tests
    await page.route(
      (url) => url.hostname.includes('generativelanguage.googleapis.com'),
      async (route) => {
        // Respond fast with an error so the app falls back to default analysis
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'blocked by test' }) });
      }
    );
  });

  test('should create a new todo from home page', async ({ page }) => {
    await page.goto('/');

    // Ensure Create a Task toggle button is visible and enabled
    const toggleButton = page.getByRole('button', { name: 'Create a Task' });
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toBeEnabled();

    // Wait until billing subscription is initialized so maxTasks usage check passes
    await page.waitForFunction(() => {
      try {
        const raw = localStorage.getItem('billing-storage');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Boolean(parsed?.state?.subscription?.limits?.maxTasks);
      } catch {
        return false;
      }
    }, undefined, { timeout: 5000 });

    await toggleButton.click();
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();

    // Fill the task title and submit
    const taskTitle = 'Write E2E todo item';
    const titleArea = page.locator('textarea#task-title');
    await expect(titleArea).toBeVisible();
    await titleArea.fill(taskTitle);

    // Submit the form
    await page.getByRole('button', { name: 'Create task' }).click();

    // The form closes on success, and the new todo appears in the list
    await expect(page.getByRole('button', { name: 'Create a Task' })).toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();
  });
});
