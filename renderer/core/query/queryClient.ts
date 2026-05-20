import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient for the application.
 * Exported as a singleton so it can be referenced outside React tree
 * (e.g. to invalidate queries from the session store on logout).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes — no redundant refetches while using a form
      staleTime: 5 * 60 * 1000,
      // Keep unused cache entries for 10 minutes before GC
      gcTime: 10 * 60 * 1000,
      // Don't retry metadata fetches — ARAS errors are usually auth/session issues
      retry: 1,
      // Don't refetch when the window regains focus (this is a desktop app)
      refetchOnWindowFocus: false,
    },
  },
});
