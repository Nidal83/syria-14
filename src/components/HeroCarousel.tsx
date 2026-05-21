import { useState, useEffect, useCallback } from 'react';
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
  // { image: '/hero-aleppo.png',  title: { ar: 'حلب',      en: 'Aleppo'  }, subtitle: { ar: 'مدينة التاريخ والحضارة',  en: 'City of history and culture' }, cta: { label: { ar: 'تصفح عقارات حلب',       en: 'Browse Aleppo'   }, href: `${PATHS.properties}?city=aleppo`   } },
  // { image: '/hero-latakia.png', title: { ar: 'اللاذقية', en: 'Latakia' }, subtitle: { ar: 'جوهرة الساحل السوري',    en: 'Pearl of the Syrian coast'    }, cta: { label: { ar: 'تصفح عقارات اللاذقية', en: 'Browse Latakia'  }, href: `${PATHS.properties}?city=latakia`  } },
  // { image: '/hero-tartus.png',  title: { ar: 'طرطوس',    en: 'Tartus'  }, subtitle: { ar: 'منتجع الشاطئ الأزرق',   en: 'The blue beach resort'        }, cta: { label: { ar: 'تصفح عقارات طرطوس',    en: 'Browse Tartus'   }, href: `${PATHS.properties}?city=tartus`   } },
];

const AUTO_PLAY_MS = 6000;
// Card spans 94 vw; 3 vw peeks on each side. Gap between cards: 12 px.
const CARD_VW = 94;
const CARD_GAP = 12;

export function HeroCarousel() {
  const { locale, isRTL } = useI18n();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
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

  return (
    <section
      className="flex h-screen flex-col overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 8 px gap from the bottom of the sticky header */}
      <div className="h-2 shrink-0" />

      {/* ── Slide track ── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {/* dir="ltr" keeps translateX direction consistent regardless of page direction */}
        <div
          dir="ltr"
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(calc(-${current} * (${CARD_VW}vw + ${CARD_GAP}px)))` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              style={{ marginInlineStart: `${(100 - CARD_VW) / 2}vw` }}
              className="relative h-full w-[94vw] shrink-0 overflow-hidden rounded-3xl"
            >
              <img
                src={s.image}
                alt={s.title[locale]}
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              {/* Bottom-heavy cinematic overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/80" />

              {/* Card content — anchored to bottom */}
              <div className="relative z-10 flex h-full flex-col items-center justify-end pb-14 text-center">
                <h2 className="text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                  {s.title[locale]}
                </h2>
                <p className="mt-3 text-base font-medium text-white/80 drop-shadow sm:text-lg">
                  {s.subtitle[locale]}
                </p>

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
          {/* trailing spacer prevents last card from hard-snapping to the right edge */}
          <div style={{ width: `${(100 - CARD_VW) / 2}vw` }} className="shrink-0" />
        </div>
      </div>

      {/* ── Bottom control bar — always rendered ── */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="flex h-12 shrink-0 items-center justify-between px-[3vw]"
      >
        <span className="text-xs font-medium uppercase tracking-widest text-white/50">
          {locale === 'ar' ? 'استكشف المناطق' : 'Explore areas'}
        </span>

        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                disabled={!multi}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Arrow buttons — dimmed and non-interactive when only one slide */}
          <button
            onClick={isRTL ? next : prev}
            disabled={!multi}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/70 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={isRTL ? prev : next}
            disabled={!multi}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/70 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 8 px gap at the very bottom */}
      <div className="h-2 shrink-0" />
    </section>
  );
}
