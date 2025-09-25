import { test, expect, type Page, type Locator } from '@playwright/test';
import { setupAuthUserMock, setupSupabaseRestMocks, setupIpifyMock } from './helpers/supabase-mocks';


test.describe('CRUD Todo', () => {
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

    // Ensure billing limits are available
    const now = new Date().toISOString();
    const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const billingState = {
      state: {
        subscription: {
          id: 'free_test_user',
          userId: 'test-user-id-123',
          tier: 'free',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: oneYear,
          cancelAtPeriodEnd: false,
          usage: {
            tasksCreated: 0,
            aiAnalysisUsed: 0,
            pomodoroSessions: 0,
            integrationsSynced: 0,
            teamMembersInvited: 0,
          },
          limits: {
            maxTasks: 50,
            maxAiAnalysis: 10,
            maxPomodoroSessions: -1,
            maxIntegrations: 1,
            maxTeamMembers: 0,
            advancedAnalytics: false,
            prioritySupport: false,
            customThemes: false,
            offlineSync: false,
            voiceToTask: false,
          },
          createdAt: now,
          updatedAt: now,
        },
        paymentMethods: [],
      },
      version: 0,
    };
    await page.addInitScript((data: Record<string, unknown>) => {
      window.localStorage.setItem('billing-storage', JSON.stringify(data));
    }, billingState);
  });

  // Helper: ensure billing ready and open the create form
  async function openCreateForm(page: Page) {
    await page.goto('/');
    const toggleButton = page.getByRole('button', { name: 'Create a Task' });
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toBeEnabled();
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
    await expect(page.getByRole('form', { name: 'Create new task' })).toBeVisible();
  }

  // Helper: create a task and return its locator and title
  async function createTask(page: Page, title: string) {
    const titleArea = page.locator('textarea#task-title');
    await expect(titleArea).toBeVisible();
    await titleArea.fill(title);
    await page.getByRole('button', { name: 'Create task' }).click();
    await expect(page.getByRole('button', { name: 'Create a Task' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Create new task' })).toBeHidden();
    const task = page.locator('.task-item').filter({ hasText: title }).first();
    await expect(task).toBeVisible();
    return task;
  }

  // Helper: add subtask and return its locator
  async function addSubtask(task: Locator, title: string) {
    await task.getByRole('button', { name: 'Subtask' }).click();
    const subForm = task.getByRole('form', { name: 'Create new subtask' });
    await expect(subForm).toBeVisible();
    await subForm.locator('textarea#task-title').fill(title);
    await subForm.getByRole('button', { name: 'Create subtask' }).click();
    const subtask = task.locator('.task-item').filter({ hasText: title }).first();
    await expect(subtask).toBeVisible();
    return subtask;
  }

  test('create task', async ({ page }) => {
    await openCreateForm(page);
    const task = await createTask(page, 'Write E2E todo item');
    await expect(task).toBeVisible();
  });

  test('add subtask to task', async ({ page }) => {
    await openCreateForm(page);
    const task = await createTask(page, 'Parent task');
    const sub = await addSubtask(task, 'Child subtask');
    await expect(sub).toBeVisible();
  });

  test('edit task and subtask', async ({ page }) => {
    await openCreateForm(page);
    const task = await createTask(page, 'Task to edit');
    const sub = await addSubtask(task, 'Subtask to edit');

    // Edit task
    await task.locator('.task-actions button').first().click();
    await task.locator('textarea').first().fill('Task to edit (edited)');
    await task.getByRole('button', { name: 'Save' }).click();
    await expect(task).toContainText('Task to edit (edited)');

    // Edit subtask
    await sub.locator('.task-actions button').first().click();
    await sub.locator('textarea').first().fill('Subtask to edit (edited)');
    await sub.getByRole('button', { name: 'Save' }).click();
    await expect(sub).toContainText('Subtask to edit (edited)');
  });

  test('delete subtask then task', async ({ page }) => {
    await openCreateForm(page);
    const task = await createTask(page, 'Task to delete');
    const sub = await addSubtask(task, 'Subtask to delete');

    // Delete subtask
    await sub.locator('.task-actions button').nth(1).click();
    await sub.getByRole('button', { name: 'Delete' }).click();
    await expect(task.locator('.task-item').filter({ hasText: 'Subtask to delete' })).toHaveCount(0);

    // Delete task
    await task.locator('.task-actions button').nth(1).click();
    await task.getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('.task-item').filter({ hasText: 'Task to delete' })).toHaveCount(0);
  });
});
