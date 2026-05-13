import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
              {t.common.appName}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t.nav.properties}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to={PATHS.properties} className="transition-colors hover:text-primary">
                  {t.nav.properties}
                </Link>
              </li>
              <li>
                <Link to={PATHS.search} className="transition-colors hover:text-primary">
                  {t.nav.search}
                </Link>
              </li>
              <li>
                <Link to={PATHS.offices} className="transition-colors hover:text-primary">
                  {t.nav.offices}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t.nav.account}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to={PATHS.login} className="transition-colors hover:text-primary">
                  {t.nav.login}
                </Link>
              </li>
              <li>
                <Link to={PATHS.register} className="transition-colors hover:text-primary">
                  {t.nav.register}
                </Link>
              </li>
              <li>
                <Link to={PATHS.favorites} className="transition-colors hover:text-primary">
                  {t.nav.favorites}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t.nav.contact}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to={PATHS.contact} className="transition-colors hover:text-primary">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {year} {t.common.appName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
