import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import syria14Logo from '@/assets/syria14-logo.png';
import { ROUTES } from '@/app/route-paths';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to={ROUTES.home} className="mb-3 flex items-center gap-2">
              <img src={syria14Logo} alt="Syria14" className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">{t('footer.desc')}</p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">{t('nav.search')}</h4>
            <div className="flex flex-col gap-1">
              <Link
                to={`${ROUTES.search}?type=rent`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('listing.rent')}
              </Link>
              <Link
                to={`${ROUTES.search}?type=sale`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('listing.sale')}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">{t('nav.contact')}</h4>
            <div className="flex flex-col gap-1">
              <Link
                to={ROUTES.terms}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('page.terms')}
              </Link>
              <Link
                to={ROUTES.privacy}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('page.privacy')}
              </Link>
              <Link
                to={ROUTES.contact}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('page.contact')}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          © 2026 Syria14 — syria14.com — {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
