import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

interface Slide {
  image: string;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  cta: { label: { ar: string; en: string }; href: string };
}

const SLIDES: Slide[] = [
  {
    image: '/hero-damascus.png',
    title: { ar: 'دمشق', en: 'Damascus' },
    subtitle: { ar: 'قلب سوريا وعاصمتها الأبدية', en: 'The heart and eternal capital of Syria' },
    cta: {
      label: { ar: 'تصفح عقارات دمشق', en: 'Browse Damascus' },
      href: `${PATHS.properties}?city=damascus`,
    },
  },
  // Add more slides as images become available:
  // { image: '/hero-aleppo.png',   title: { ar: 'حلب',       en: 'Aleppo'   }, subtitle: { ar: 'مدينة التاريخ والحضارة', en: 'City of history and culture' }, cta: { label: { ar: 'تصفح عقارات حلب',    en: 'Browse Aleppo'   }, href: `${PATHS.properties}?city=aleppo`   } },
  // { image: '/hero-latakia.png',  title: { ar: 'اللاذقية',  en: 'Latakia'  }, subtitle: { ar: 'جوهرة الساحل السوري',   en: 'Pearl of the Syrian coast' },    cta: { label: { ar: 'تصفح عقارات اللاذقية', en: 'Browse Latakia'  }, href: `${PATHS.properties}?city=latakia`  } },
  // { image: '/hero-tartus.png',   title: { ar: 'طرطوس',     en: 'Tartus'   }, subtitle: { ar: 'منتجع الشاطئ الأزرق',   en: 'The blue beach resort' },         cta: { label: { ar: 'تصفح عقارات طرطوس',  en: 'Browse Tartus'   }, href: `${PATHS.properties}?city=tartus`   } },
];

const AUTO_PLAY_MS = 6000;

export function HeroCarousel() {
  const { locale, isRTL } = useI18n();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const multi = SLIDES.length > 1;

  const goTo = useCallback((index: number) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (!multi || paused) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [multi, paused, next]);

  const slide = SLIDES[current];
  const title = slide.title[locale];
  const subtitle = slide.subtitle[locale];
  const ctaLabel = slide.cta.label[locale];

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide track (always LTR so transform direction is predictable) ── */}
      <div
        ref={trackRef}
        dir="ltr"
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(calc(-${current} * (82vw + 20px)))` }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="relative ms-[9vw] flex h-[88vh] w-[82vw] flex-shrink-0 overflow-hidden rounded-3xl"
          >
            <img
              src={s.image}
              alt={s.title[locale]}
              className="absolute inset-0 h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Deep cinematic overlay — bottom-heavy like DeepMind */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75" />

            {/* ── Card content ── */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-end pb-16 text-center">
              <h2 className="text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                {s.title[locale]}
              </h2>
              <p className="mt-3 text-base font-medium text-white/80 drop-shadow sm:text-lg">
                {s.subtitle[locale]}
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to={s.cta.href}
                  className="rounded-full bg-white px-7 py-2.5 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
                >
                  {s.cta.label[locale]}
                </Link>
                <Link
                  to={PATHS.search}
                  className="rounded-full border border-white/60 bg-white/10 px-7 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  {locale === 'ar' ? 'البحث المتقدم' : 'Advanced Search'}
                </Link>
              </div>
            </div>
          </div>
        ))}
        {/* trailing spacer so last card doesn't snap hard-right */}
        <div className="w-[9vw] flex-shrink-0" />
      </div>

      {/* ── Bottom bar: label + nav arrows ── */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="mx-[9vw] mb-3 mt-4 flex items-center justify-between"
      >
        <span className="text-xs font-medium uppercase tracking-widest text-white/60">
          {locale === 'ar' ? 'استكشف المناطق' : 'Explore areas'}
        </span>

        {multi && (
          <div className="flex items-center gap-2">
            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <button
              onClick={isRTL ? next : prev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/70 transition hover:border-white hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={isRTL ? prev : next}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/70 transition hover:border-white hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
