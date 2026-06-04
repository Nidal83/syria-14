/**
 * Combines all app-level providers in the correct order:
 * I18n → Query → Auth
 *
 * Add new providers here — never wrap them directly in main.tsx or App.tsx.
 */
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          {/* App-wide toast outlet. Without this every toast() — success,
              error, and form-validation feedback — is silently dropped. */}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </QueryProvider>
    </I18nProvider>
  );
}
