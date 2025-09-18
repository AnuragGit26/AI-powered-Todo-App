import { test, expect } from '@playwright/test';
import { setupSignupMock, setupSignInMock, setupAuthUserMock, setupSupabaseRestMocks, setupIpifyMock } from './helpers/supabase-mocks';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthUserMock(page);
        await setupSupabaseRestMocks(page);
        await setupIpifyMock(page);
    });
    test('should navigate to the home page', async ({ page }) => {
        await page.goto('http://localhost:5175/');
        await expect(page).toHaveTitle('TaskMind AI');
    });

    test('check login functions', async ({ page }) => {
        // Mock Supabase password grant sign-in to avoid real network calls on CI
        await setupSignInMock(page, 'signInSuccess');
        await page.goto('http://localhost:5175/login');
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
        await page.getByLabel('Email').fill('test_user@gmail.com');
        await page.getByLabel('Password', { exact: true }).fill('testpassword@123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page.getByRole('button', { name: 'Create a Task' })).toBeVisible();
    });

    test.describe('Signup Flow', () => {
        const testUser = {
            username: `testuser_123`,
            email: `testuser_123@temp-mail.org`,
            password: 'Test@12345',
        };

        test.beforeEach(async ({ page }) => {
            await page.context().clearCookies();
            await page.goto('http://localhost:5175/signup');
            await expect(page).toHaveURL(/\/signup$/);
        });

        test('should have all required signup form fields', async ({ page }) => {
            const formFields = [
                { label: 'Username' },
                { label: 'Email' },
                { label: 'Password', exact: true },
            ];

            for (const field of formFields) {
                await test.step(`should have ${field.label} field`, async () => {
                    const element = field.exact
                        ? page.getByLabel(field.label, { exact: true })
                        : page.getByLabel(field.label);
                    await expect(element).toBeVisible();
                    await expect(element).toBeEnabled();
                });
            }
            const submitButton = page.getByRole('button', { name: /Create Account/i });
            await expect(submitButton).toBeVisible();
            await expect(submitButton).toBeEnabled();
        });

        test('should successfully create a new account with valid credentials', async ({ page }) => {
            await setupSignupMock(page, 'signupSuccess');
            await page.getByLabel('Username').fill(testUser.username);
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password', { exact: true }).fill(testUser.password);

            await page.getByRole('button', { name: /Create Account/i }).click();

            await Promise.race([
                page.getByTestId('success-message').waitFor({ timeout: 5000 }),
                page.waitForURL('http://localhost:5175/')
            ]);

            if (page.url() === 'http://localhost:5175/') {
                await expect(page).toHaveURL('http://localhost:5175/');
            } else {
                await expect(page.getByTestId('success-message')).toBeVisible();
            }
        });

        test('should handle signup errors gracefully', async ({ page }) => {
            await setupSignupMock(page, 'signupEmailExists');
            await page.getByLabel('Username').fill(testUser.username);
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password', { exact: true }).fill(testUser.password);
            await page.getByRole('button', { name: /Create Account/i }).click();
            await page.waitForTimeout(2000);
            const errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|Error|already|registered/i });
            await expect(errorAlert).toBeVisible();
        });

        test('should handle rate limiting gracefully', async ({ page }) => {
            await setupSignupMock(page, 'signupRateLimited');
            await page.getByLabel('Username').fill(testUser.username);
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password', { exact: true }).fill(testUser.password);
            await page.getByRole('button', { name: /Create Account/i }).click();
            await page.waitForTimeout(2000);
            const rateLimitAlert = page.locator('[role="alert"]').filter({
                hasText: /too many requests|rate limit|try again later/i
            });
            await expect(rateLimitAlert).toBeVisible();
        });

        test('should show validation errors for invalid inputs', async ({ page }) => {
            const testCases = [
                { field: 'Username', value: 'ab', error: 'Username must be at least 3 characters' },
                { field: 'Email', value: 'invalid-email', error: 'Please enter a valid email' },
                { field: 'Password', value: 'weak', error: 'Password must be at least 8 characters' },
            ];

            for (const { field, value, error } of testCases) {
                await test.step(`should validate ${field} field`, async () => {
                    if (field !== 'Username') {
                        await page.getByLabel('Username').fill('validusername');
                    }
                    if (field !== 'Email') {
                        await page.getByLabel('Email').fill('validuser@test-mail.org');
                    }
                    if (field !== 'Password') {
                        await page.getByLabel('Password', { exact: true }).fill('ValidPass123!');
                    }
                    await page.getByLabel(field).fill(value);
                    await page.getByRole('button', { name: /create account/i }).click();
                    await expect(page.getByText(error)).toBeVisible();
                });
            }
        });
    });
});