import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * React Query client.
 *
 * Defaults tuned for a real-estate listing app:
 * - 5-minute stale time: listings don't change every second.
 * - 30-minute gc time: keep cached data around for tab-switching users.
 * - 1 retry: network blips happen, but don't hammer on real errors.
 * - refetchOnWindowFocus off: too noisy for browsing UX.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * All app-wide providers in one place.
 *
 * Order matters:
 *   QueryClient   — outermost, needed by everything else that fetches.
 *   Language      — sets `dir`/`lang` on <html>; Theme depends on no language.
 *   Theme         — applies CSS classes, no language dep.
 *   Auth          — depends on Supabase (via QueryClient implicitly).
 *   Tooltip       — Radix tooltip portal root.
 *   Toaster(s)    — global toast UI.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
