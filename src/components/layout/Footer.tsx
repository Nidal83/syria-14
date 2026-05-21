import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Facebook, Instagram } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

const SOCIAL_LINKS = [
  {
    href: 'https://www.facebook.com/syriafourteenrealestate',
    label: 'Facebook',
    icon: <Facebook className="h-4 w-4" />,
  },
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    href: 'https://wa.me/',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.107 1.517 5.836L.057 23.855a.563.563 0 0 0 .677.704l6.052-1.463A11.939 11.939 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.848 0-3.596-.497-5.103-1.367l-.365-.214-3.794.917.955-3.688-.236-.381A9.818 9.818 0 0 1 2.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.419-4.4 9.818-9.818 9.818z" />
      </svg>
    ),
  },
  {
    href: 'https://t.me/',
    label: 'Telegram',
    icon: <Send className="h-4 w-4" />,
  },
];

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#111827] text-[#F5F2EC]">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-3">
            <Logo variant="light" size="sm" />
            <p className="text-sm font-semibold text-[#D8C4A8]">Syria 14</p>
            <p className="max-w-[200px] text-xs leading-relaxed text-[#D9D9D7]">
              {t.common.tagline}
            </p>
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-[#D9D9D7] transition-colors hover:text-[#D8C4A8]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Properties column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#D8C4A8]">{t.nav.properties}</h3>
            <ul className="space-y-2 text-sm text-[#D9D9D7]">
              <li>
                <Link to={PATHS.home} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to={PATHS.properties} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.properties}
                </Link>
              </li>
              <li>
                <Link to={PATHS.search} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.search}
                </Link>
              </li>
              <li>
                <Link to={PATHS.offices} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.offices}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#D8C4A8]">{t.nav.account}</h3>
            <ul className="space-y-2 text-sm text-[#D9D9D7]">
              <li>
                <Link to={PATHS.login} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.login}
                </Link>
              </li>
              <li>
                <Link to={PATHS.register} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.register}
                </Link>
              </li>
              <li>
                <Link to={PATHS.favorites} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.favorites}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#D8C4A8]">{t.nav.contact}</h3>
            <ul className="space-y-2 text-sm text-[#D9D9D7]">
              <li>
                <Link to={PATHS.contact} className="transition-colors hover:text-[#D8C4A8]">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#D9D9D7]">
          © {year} Syria 14. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
