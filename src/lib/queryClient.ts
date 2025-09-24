import { QueryClient } from '@tanstack/react-query';

// Centralized QueryClient
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});
