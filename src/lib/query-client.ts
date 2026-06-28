import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. LLM operations are long-running and triggered
 * explicitly, so we keep automatic refetching conservative.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
