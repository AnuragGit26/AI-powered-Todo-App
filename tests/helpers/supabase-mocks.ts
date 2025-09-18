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
};

// Helper function to setup signup mocking
export async function setupSignupMock(page: import('@playwright/test').Page, scenario: keyof typeof mockSupabaseResponses = 'signupSuccess') {
    await page.route((url) => url.pathname.includes('/auth/v1/signup'), async route => {
        await route.fulfill(mockSupabaseResponses[scenario]);
    });
}
