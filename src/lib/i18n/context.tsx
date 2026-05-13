import React, { createContext, useContext, useState, useEffect } from 'react';
import { ar } from './locales/ar';
import { en } from './locales/en';
import type { Translations } from './locales/ar';

export type Locale = 'ar' | 'en';

const LOCALES: Record<Locale, Translations> = { ar, en };
const STORAGE_KEY = 'sh_locale';
const DEFAULT_LOCALE: Locale = 'ar';

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && stored in LOCALES ? stored : DEFAULT_LOCALE;
  });

  const t = LOCALES[locale];
  const isRTL = t.dir === 'rtl';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', t.dir);
    root.setAttribute('lang', t.lang);
    document.body.style.fontFamily = isRTL
      ? 'var(--font-arabic), var(--font-english), sans-serif'
      : 'var(--font-english), var(--font-arabic), sans-serif';
  }, [locale, t.dir, t.lang, isRTL]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleLocale() {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
