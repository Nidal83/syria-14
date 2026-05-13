import { Link } from 'react-router-dom';
import { Search, Home, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-center bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60">
        <div className="container py-20 text-center text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t.common.appName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{t.pages.properties}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to={PATHS.properties}>
                <Home className="me-2 h-5 w-5" />
                {t.nav.properties}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              asChild
            >
              <Link to={PATHS.search}>
                <Search className="me-2 h-5 w-5" />
                {t.nav.search}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="container py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Home, label: t.nav.properties, href: PATHS.properties },
            { icon: Search, label: t.nav.search, href: PATHS.search },
            { icon: Building2, label: t.nav.offices, href: PATHS.offices },
          ].map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              to={href}
              className="hover:shadow-card-hover group flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-card transition-all hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <span className="font-semibold">{label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
