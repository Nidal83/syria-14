/**
 * Combines all app-level providers in the correct order:
 * I18n → Query → Auth
 *
 * Add new providers here — never wrap them directly in main.tsx or App.tsx.
 */
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </I18nProvider>
  );
}
