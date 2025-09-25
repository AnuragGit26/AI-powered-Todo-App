
import { test, expect, type Page } from '@playwright/test';
import { setupSupabaseRestMocks, setupIpifyMock } from './helpers/supabase-mocks';

// Utility to capture request payloads
type Json = Record<string, unknown>;
const capture = () => {
  const calls: Json[] = [];
  return {
    add: (data: Json) => calls.push(data),
    count: () => calls.length,
  };
};

// A minimal successful response for supabase auth user update
const respond200Json = (body: unknown = { user: { id: 'u1' } }) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

// A minimal successful response for supabase password reset request
const respondRecoverOk = respond200Json({});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
} as const;

// Ensure non-essential external calls do not leak out during tests
async function setupGlobalMocks(page: Page) {
  await setupIpifyMock(page);
  await setupSupabaseRestMocks(page);
  // Stub all Supabase auth endpoints (token, verify, user, recover, etc.)
  await page.route((url) => url.pathname.includes('/auth/v1/'), async (route) => {
    // Respond to CORS preflight explicitly (Safari/WebKit is strict)
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    // Allow more specific handlers in individual tests (e.g., /user, /recover) to capture
    return route.fallback();
  });
  // Block analytics or unknown external domains to keep tests hermetic
  await page.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    // Allow app assets and Supabase requests to fall through to other routes/handlers
    if (u.hostname.includes('localhost')) return route.fallback();
    if (u.hostname.includes('supabase.co')) return route.fallback();
    // Stub everything else
    return route.fulfill(respond200Json({ ok: true, url: u.href }));
  });
}

// ---- Tests ----

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupGlobalMocks(page);
  });


  test('Request mode sends reset email and prevents duplicates', async ({ page }) => {
    const recoverCalls = capture();

    // Intercept recover endpoint
    await page.route((url) => url.pathname.includes('/auth/v1/recover'), async (route) => {
      if (route.request().method() === 'POST') {
        try {
          const data = route.request().postDataJSON();
          recoverCalls.add(data);
        } catch {
          // ignore
        }
      }
      await route.fulfill(respondRecoverOk);
    });

    await page.goto('/reset-password');

    await page.getByLabel('Email Address').fill('anu.bokaro.ak@gmail.com');
    await page.getByRole('button', { name: /send password reset link/i }).click();

    const sentBtn = page.getByRole('button', { name: 'Sent' });
    await expect(sentBtn).toBeVisible();
    await expect(sentBtn).toBeDisabled();

    await expect.poll(() => recoverCalls.count()).toBe(1);
  });
});
