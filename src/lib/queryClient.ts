import { QueryClient } from '@tanstack/react-query';

// Centralized QueryClient to be used app-wide (Provider + utility functions)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
