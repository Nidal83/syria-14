import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, LayoutDashboard, Send } from 'lucide-react';
import { Facebook, Instagram } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { isAdmin, isOffice, isPendingOffice } from '@/lib/roles';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

// ─── Social links ─────────────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    icon: <Facebook className="h-5 w-5" />,
  },
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    href: 'https://wa.me/',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.107 1.517 5.836L.057 23.855a.563.563 0 0 0 .677.704l6.052-1.463A11.939 11.939 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.848 0-3.596-.497-5.103-1.367l-.365-.214-3.794.917.955-3.688-.236-.381A9.818 9.818 0 0 1 2.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.419-4.4 9.818-9.818 9.818z" />
      </svg>
    ),
  },
  {
    href: 'https://t.me/',
    label: 'Telegram',
    icon: <Send className="h-5 w-5" />,
  },
];

function SocialIconLinks({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="text-white/80 transition-colors hover:text-[#D8C4A8]"
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { t } = useI18n();
  const { profile, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: PATHS.properties, label: t.nav.properties },
    { href: PATHS.offices, label: t.nav.offices },
    { href: PATHS.search, label: t.nav.search },
    { href: PATHS.contact, label: t.nav.contact },
  ];

  const dashboardHref = isAdmin(profile)
    ? PATHS.adminDashboard
    : isOffice(profile)
      ? PATHS.officeDashboard
      : isPendingOffice(profile)
        ? PATHS.officeApplicationStatus
        : PATHS.account;

  const initials = profile?.name
    ? profile.name.slice(0, 2).toUpperCase()
    : (profile?.email?.slice(0, 2).toUpperCase() ?? '??');

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* ── Row 1 — Nordic Navy bar ── */}
      <div className="bg-[#1F2C3D]">
        <div className="container flex h-14 items-center">
          {/* Left: auth controls (desktop) */}
          <div className="hidden w-1/3 items-center gap-2 md:flex">
            <LanguageSwitcher />

            {isAuthenticated && profile ? (
              <>
                <Link to={PATHS.favorites} aria-label={t.nav.favorites}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-[#D8C4A8] text-xs font-bold text-[#111827]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile.name || profile.email}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={dashboardHref} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t.nav.dashboard}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={PATHS.account} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.nav.account}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.nav.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-white/40 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link to={PATHS.login}>{t.nav.login}</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-[#D8C4A8] text-[#111827] hover:bg-[#D8C4A8]/85"
                  asChild
                >
                  <Link to={PATHS.register}>{t.nav.register}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Center: Logo */}
          <div className="flex flex-1 justify-center md:w-1/3 md:flex-none">
            <Logo variant="light" size="md" eager />
          </div>

          {/* Right: Social icons (desktop) + hamburger (mobile) */}
          <div className="flex w-auto items-center justify-end gap-3 md:w-1/3">
            <SocialIconLinks className="hidden md:flex" />

            {/* Mobile: hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Row 2 — Warm Sand nav bar (desktop) ── */}
      <nav className="hidden bg-[#D8C4A8] md:block" aria-label="Main navigation">
        <div className="container flex h-11 items-center justify-center gap-8">
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-semibold uppercase tracking-wide text-[#1F2C3D] transition-colors hover:text-[#111827]',
                  active && 'border-b-2 border-[#1F2C3D] pb-0.5',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#1F2C3D] md:hidden">
          <nav className="container flex flex-col gap-1 py-3" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10',
                  location.pathname === link.href && 'bg-white/10',
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
                <Button
                  variant="ghost"
                  className="w-full border border-white/40 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link to={PATHS.login} onClick={() => setMobileOpen(false)}>
                    {t.nav.login}
                  </Link>
                </Button>
                <Button
                  className="w-full bg-[#D8C4A8] text-[#111827] hover:bg-[#D8C4A8]/85"
                  asChild
                >
                  <Link to={PATHS.register} onClick={() => setMobileOpen(false)}>
                    {t.nav.register}
                  </Link>
                </Button>
              </div>
            )}

            {/* Social links in mobile menu */}
            <div className="mt-3 flex justify-center border-t border-white/20 pt-3">
              <SocialIconLinks />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
