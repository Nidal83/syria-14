import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useI18n } from '@/lib/i18n/context';
import { MAIN_CONTENT_ID } from '@/lib/a11y';

export function PageLayout() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-md focus:outline-none"
      >
        {t.common.skipToContent}
      </a>
      <Header />
      <main id={MAIN_CONTENT_ID} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
