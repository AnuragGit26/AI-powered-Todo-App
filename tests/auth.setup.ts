import { test, expect } from '@playwright/test';
import { setupSignInMock, setupAuthUserMock, setupSupabaseRestMocks, setupIpifyMock } from './helpers/supabase-mocks';
import * as fs from 'fs';
import * as path from 'path';


test.describe('Auth Setup', () => {
    test('authenticate and save storage state', async ({ page }) => {
        // Mock network calls to avoid real external requests
        await setupAuthUserMock(page);
        await setupSupabaseRestMocks(page);
        await setupIpifyMock(page);
        await setupSignInMock(page, 'signInSuccess');

        // Perform login
        await page.goto('/login');

        // Wait for the form to be fully loaded and interactive
        await page.waitForSelector('form[role="form"]', { state: 'visible' });
        await expect(page.getByLabel('Email address')).toBeVisible();
        await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
        await page.getByLabel('Email address').fill('test_user@gmail.com');
        await page.getByLabel('Password', { exact: true }).fill('testpassword@123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Verify we landed on the app home and the create button is visible
        await expect(page.getByRole('button', { name: 'Create a Task' })).toBeVisible();

        // Persist login state for all subsequent tests that depend on this project
        const storagePath = 'playwright/.auth/user.json';
        fs.mkdirSync(path.dirname(storagePath), { recursive: true });
        await page.context().storageState({ path: storagePath });
    });
});
