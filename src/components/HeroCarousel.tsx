import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

interface Slide {
  image?: string;
  gradient: string; // shown when image absent or as overlay tint
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  cta: { label: { ar: string; en: string }; href: string };
}

const SLIDES: Slide[] = [
  {
    image: '/hero-damascus.png',
    gradient: 'from-[#1a0a00]/10 via-[#1a0a00]/20 to-[#1a0a00]/75',
    title: { ar: 'دمشق', en: 'Damascus' },
    subtitle: { ar: 'قلب سوريا وعاصمتها الأبدية', en: 'The heart and eternal capital of Syria' },
    cta: {
      label: { ar: 'تصفح عقارات دمشق', en: 'Browse Damascus' },
      href: `${PATHS.properties}?city=damascus`,
    },
  },
  {
    // Aleppo — warm amber gradient until real image is added
    gradient: 'from-[#1c0e00]/10 via-[#2d1800]/20 to-[#1c0e00]/80',
    image: '/hero-aleppo.png',
    title: { ar: 'حلب', en: 'Aleppo' },
    subtitle: {
      ar: 'مدينة التاريخ والحضارة العريقة',
      en: 'City of history and ancient civilization',
    },
    cta: {
      label: { ar: 'تصفح عقارات حلب', en: 'Browse Aleppo' },
      href: `${PATHS.properties}?city=aleppo`,
    },
  },
  {
    // Latakia — coastal blue gradient until real image is added
    gradient: 'from-[#001020]/10 via-[#002040]/20 to-[#001020]/80',
    image: '/hero-latakia.png',
    title: { ar: 'اللاذقية', en: 'Latakia' },
    subtitle: { ar: 'جوهرة الساحل السوري', en: 'Pearl of the Syrian coast' },
    cta: {
      label: { ar: 'تصفح عقارات اللاذقية', en: 'Browse Latakia' },
      href: `${PATHS.properties}?city=latakia`,
    },
  },
];

const AUTO_PLAY_MS = 5000;

const contentVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: 'easeIn' } },
};

const arrowBase =
  'absolute top-1/2 z-30 flex -translate-y-1/2 items-center justify-center ' +
  'rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md ' +
  'transition-all duration-300 hover:scale-110 hover:bg-white/28 ' +
  'h-9 w-9 md:h-11 md:w-11';

export function HeroCarousel() {
  const { locale, isRTL } = useI18n();
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Embla handles physics, looping and touch/swipe natively
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 38, // controls animation speed — higher = smoother/slower
    direction: isRTL ? 'rtl' : 'ltr',
  });

  // Keep selectedIndex in sync with Embla
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Manual autoplay — interval resets whenever emblaApi or paused changes
  useEffect(() => {
    if (!emblaApi || paused) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [emblaApi, paused]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const slide = SLIDES[selectedIndex];

  return (
    <section
      className="bg-[#f5f3ef] px-3 pb-8 pt-5 md:px-6 md:pb-12 md:pt-7 lg:px-10 lg:pb-16 lg:pt-9"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1480px]">
        {/* ── Rounded panoramic container ── */}
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] md:aspect-[16/9] md:rounded-3xl lg:aspect-[21/9]">
          {/* ── Embla viewport (handles slides + touch) ── */}
          <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">
              {SLIDES.map((s, i) => (
                <div key={i} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {/* Background: image with CSS gradient fallback */}
                  {s.image && (
                    <img
                      src={s.image}
                      alt={s.title[locale]}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  {/* Gradient overlay — acts as fallback bg colour AND text legibility layer */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${s.gradient}`} />
                  {/* Solid dark base when no image is present */}
                  {!s.image && <div className="absolute inset-0 -z-10 bg-[#1a1208]" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Slide content — Framer Motion fade on change ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-8 text-center md:pb-11 lg:pb-14"
            >
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {slide.title[locale]}
              </h2>
              <p className="mt-2 text-sm font-medium text-white/80 drop-shadow md:mt-3 md:text-base lg:text-lg">
                {slide.subtitle[locale]}
              </p>
              <div className="pointer-events-auto mt-5 flex flex-wrap justify-center gap-2.5 md:mt-7 md:gap-3">
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
            onClick={isRTL ? scrollNext : scrollPrev}
            aria-label="Previous slide"
            className={`${arrowBase} left-3 md:left-5`}
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          {/* ── Right arrow ── */}
          <button
            onClick={isRTL ? scrollPrev : scrollNext}
            aria-label="Next slide"
            className={`${arrowBase} right-3 md:right-5`}
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          {/* ── Dot indicators ── */}
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 md:bottom-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              >
                <motion.span
                  animate={{
                    width: i === selectedIndex ? 24 : 6,
                    backgroundColor: i === selectedIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
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
