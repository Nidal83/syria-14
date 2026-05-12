import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Page fallback shown while a lazy-loaded route is downloading.
 * Lives inside the layout so the header/footer stay in place during transitions.
 */
function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * App shell. Renders Header + main + Footer with the routed page injected
 * via React Router's <Outlet />. Lazy-route loading is handled by the Suspense
 * boundary here, so navigation never blanks the chrome.
 */
const Layout = () => {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      {theme === 'syria' && <div className="syria-flag-bg" />}
      <Header />
      <main className="relative z-10 flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
