// Test helpers for mocking Supabase API calls
export const mockSupabaseResponses = {
    // Mock successful signup response
    signupSuccess: {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            user: {
                id: 'test-user-id-123',
                email: 'testuser_123@temp-mail.org',
                user_metadata: {
                    username: 'testuser_123'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            session: null,
            access_token: 'mock-access-token-123',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token-123'
        })
    },

    // Mock email already registered error
    signupEmailExists: {
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
            error: 'User already registered',
            message: 'User already registered',
            status: 400
        })
    },

    // Mock invalid email error
    signupInvalidEmail: {
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
            code: 'email_address_invalid',
            message: 'Email address is invalid',
            status: 400
        })
    },

    // Mock rate limiting error
    signupRateLimited: {
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            status: 429
        })
    },
  
  // Sign in success (password grant)
  signInSuccess: {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      access_token: 'mock-access-token-123',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-123',
      user: {
        id: 'test-user-id-123',
        email: 'test_user@gmail.com',
        user_metadata: {
          username: 'test_user'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  },

  // Sign in invalid credentials
  signInInvalidCredentials: {
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({
      error: 'invalid_grant',
      error_description: 'Invalid login credentials'
    })
  }
};

// Helper function to setup signup mocking
export async function setupSignupMock(page: import('@playwright/test').Page, scenario: keyof typeof mockSupabaseResponses = 'signupSuccess') {
    await page.route((url) => url.pathname.includes('/auth/v1/signup'), async route => {
        await route.fulfill(mockSupabaseResponses[scenario]);
    });
}

// Helper function to setup sign-in mocking (password grant)
export async function setupSignInMock(
  page: import('@playwright/test').Page,
  scenario: keyof typeof mockSupabaseResponses = 'signInSuccess'
) {
  await page.route(
    (url) => url.pathname.includes('/auth/v1/token') && url.searchParams.get('grant_type') === 'password',
    async (route) => {
      await route.fulfill(mockSupabaseResponses[scenario]);
    }
  );
}

// Helper to mock the Supabase auth user endpoint after login
export async function setupAuthUserMock(page: import('@playwright/test').Page) {
  await page.route(
    (url) => url.pathname.includes('/auth/v1/user'),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id-123',
            email: 'test_user@gmail.com',
            user_metadata: { username: 'test_user' },
            app_metadata: { provider: 'email' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      });
    }
  );
}

// Helper to stub Supabase PostgREST calls used by activity logging and metrics
export async function setupSupabaseRestMocks(page: import('@playwright/test').Page) {
  await page.route(
    (url) => url.pathname.includes('/rest/v1/'),
    async (route) => {
      // Return a minimal successful JSON response
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  );
}

// Helper to stub external IP service
export async function setupIpifyMock(page: import('@playwright/test').Page) {
  await page.route(
    (url) => url.hostname.includes('api.ipify.org'),
    async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ip: '127.0.0.1' }) });
    }
  );
}
