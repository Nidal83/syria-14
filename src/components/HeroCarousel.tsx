import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const AUTO_PLAY_MS = 5000;

// Cinematic ease curve — decelerating, premium feel
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const imageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.82, ease: EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -56,
    transition: { duration: 0.82, ease: EASE },
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut', delay: 0.28 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

const arrowClass =
  'absolute top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center ' +
  'rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md ' +
  'transition-all duration-300 hover:scale-110 hover:bg-white/28 ' +
  'disabled:cursor-not-allowed disabled:opacity-25 ' +
  'md:h-11 md:w-11';

export function HeroCarousel() {
  const { locale, isRTL } = useI18n();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);
  const multi = SLIDES.length > 1;

  const goTo = useCallback((rawIndex: number, dir: number) => {
    setDirection(dir);
    setCurrent((rawIndex + SLIDES.length) % SLIDES.length);
  }, []);

  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);

  useEffect(() => {
    if (!multi || paused) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [multi, paused, next]);

  const slide = SLIDES[current];

  return (
    <section className="bg-[#f5f3ef] px-3 pb-8 pt-5 md:px-6 md:pb-12 md:pt-7 lg:px-10 lg:pb-16 lg:pt-9">
      <div className="mx-auto max-w-[1480px]">
        {/* ── Rounded panoramic container ── */}
        <div
          className={[
            'relative overflow-hidden',
            'rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] md:rounded-3xl',
            /* Responsive aspect ratio: compact on mobile → ultra-wide on desktop */
            'aspect-[3/2] md:aspect-[16/9] lg:aspect-[21/9]',
          ].join(' ')}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* ── Slide images with cinematic Framer Motion transition ── */}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <img
                src={slide.image}
                alt={slide.title[locale]}
                className="h-full w-full object-cover object-center"
                loading="eager"
                fetchPriority="high"
              />
              {/* Cinematic bottom-heavy gradient for text legibility */}
              <div className="to-black/72 absolute inset-0 bg-gradient-to-b from-black/5 via-black/15" />
            </motion.div>
          </AnimatePresence>

          {/* ── Slide content — fades in on each change ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`txt-${current}`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-8 text-center md:pb-11 lg:pb-14"
            >
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {slide.title[locale]}
              </h2>
              <p className="mt-2 text-sm font-medium text-white/80 drop-shadow md:mt-3 md:text-base lg:text-lg">
                {slide.subtitle[locale]}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2.5 md:mt-7 md:gap-3">
                <Link
                  to={slide.cta.href}
                  className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow-lg transition hover:bg-white/90 md:px-7 md:py-2.5 md:text-sm"
                >
                  {slide.cta.label[locale]}
                </Link>
                <Link
                  to={PATHS.search}
                  className="bg-white/12 hover:bg-white/22 rounded-full border border-white/55 px-5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition md:px-7 md:py-2.5 md:text-sm"
                >
                  {locale === 'ar' ? 'البحث المتقدم' : 'Advanced Search'}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Left arrow ── */}
          <button
            onClick={isRTL ? next : prev}
            disabled={!multi}
            aria-label="Previous slide"
            className={`${arrowClass} left-3 md:left-5`}
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          {/* ── Right arrow ── */}
          <button
            onClick={isRTL ? prev : next}
            disabled={!multi}
            aria-label="Next slide"
            className={`${arrowClass} right-3 md:right-5`}
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          {/* ── Dot indicators ── */}
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 md:bottom-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                aria-label={`Go to slide ${i + 1}`}
                className="group flex items-center"
              >
                <motion.span
                  animate={{
                    width: i === current ? 24 : 6,
                    backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="block h-1.5 rounded-full"
                  style={{ display: 'block', height: 6, borderRadius: 99 }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
