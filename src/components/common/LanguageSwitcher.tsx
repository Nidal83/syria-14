import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="min-w-[3.5rem] font-medium"
      aria-label="Switch language"
    >
      {locale === 'ar' ? 'EN' : 'عربي'}
    </Button>
  );
}
