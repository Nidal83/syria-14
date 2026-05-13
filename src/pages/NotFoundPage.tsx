import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6">
        <p className="text-8xl font-black text-primary/20">404</p>
        <h1 className="text-2xl font-bold">{t.pages.notFound}</h1>
        <p className="max-w-sm text-muted-foreground">{t.pages.notFoundDesc}</p>
        <Button asChild>
          <Link to={PATHS.home}>
            <Home className="me-2 h-4 w-4" />
            {t.pages.goHome}
          </Link>
        </Button>
      </div>
    </div>
  );
}
