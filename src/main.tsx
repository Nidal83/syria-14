import * as Sentry from '@sentry/react';
import { env, sentryEnabled, appEnv } from '@/shared/config/env';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (sentryEnabled) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: appEnv,
    // Performance + replay are off by default — turn on later in
    // Stage 3 if needed. They cost quota.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Ignore noisy errors from browser extensions, etc.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
      /^Non-Error promise rejection captured/,
    ],
  });
}

createRoot(document.getElementById('root')!).render(<App />);
