import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, Heart, LogOut, Menu, X, User, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import syria14Logo from '@/assets/syria14-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES, getDashboardPath } from '@/app/route-paths';
import { isApprovedOffice } from '@/lib/role-utils';

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const themeIcons: Record<Theme, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    syria: <span className="text-sm">🇸🇾</span>,
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to={ROUTES.home} className="flex items-center gap-3">
          <img src={syria14Logo} alt="Syria14 Logo" className="h-10 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to={ROUTES.home}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t('nav.home')}
          </Link>
          <Link
            to={ROUTES.search}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t('nav.search')}
          </Link>
          {user && (
            <Link
              to={ROUTES.favorites}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Heart className="me-1 inline-block h-4 w-4" />
              {t('nav.favorites')}
            </Link>
          )}
          {isApprovedOffice(user) && (
            <Link
              to={ROUTES.officeAddProperty}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="me-1 inline-block h-4 w-4" />
              {t('dash.add_property')}
            </Link>
          )}
          <Link
            to={ROUTES.contact}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t('nav.contact')}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="h-9 w-9"
            title={lang === 'ar' ? 'English' : 'العربية'}
          >
            <Globe className="h-4 w-4" />
          </Button>

          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {themeIcons[theme]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={lang === 'ar' ? 'start' : 'end'}>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="me-2 h-4 w-4" /> {t('theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="me-2 h-4 w-4" /> {t('theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('syria')}>
                <span className="me-2">🇸🇾</span> {t('theme.syria')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden gap-2 md:flex">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate text-sm">
                    {t('nav.hello')} {user.officeName || user.name}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={lang === 'ar' ? 'start' : 'end'}>
                <DropdownMenuItem onClick={() => navigate(getDashboardPath(user.role))}>
                  {t('nav.dashboard')}
                </DropdownMenuItem>
                {isApprovedOffice(user) && (
                  <DropdownMenuItem onClick={() => navigate(ROUTES.officeAddProperty)}>
                    <Plus className="me-2 h-4 w-4" /> {t('dash.add_property')}
                  </DropdownMenuItem>
                )}
                {user.role !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate(ROUTES.favorites)}>
                    {t('nav.favorites')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate(ROUTES.home);
                  }}
                >
                  <LogOut className="me-2 h-4 w-4" /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate(ROUTES.login)}
              className="gradient-primary hidden text-primary-foreground md:inline-flex"
              size="sm"
            >
              {t('nav.login')}
            </Button>
          )}

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              to={ROUTES.home}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t('nav.home')}
            </Link>
            <Link
              to={ROUTES.search}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t('nav.search')}
            </Link>
            <Link
              to={ROUTES.contact}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t('nav.contact')}
            </Link>
            {user ? (
              <>
                <Link
                  to={ROUTES.favorites}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {t('nav.favorites')}
                </Link>
                {isApprovedOffice(user) && (
                  <Link
                    to={ROUTES.officeAddProperty}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {t('dash.add_property')}
                  </Link>
                )}
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    navigate(ROUTES.home);
                  }}
                  className="rounded-md px-3 py-2 text-start text-sm font-medium text-destructive hover:bg-secondary"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                to={ROUTES.login}
                onClick={() => setMobileOpen(false)}
                className="gradient-primary rounded-md px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                {t('nav.login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
