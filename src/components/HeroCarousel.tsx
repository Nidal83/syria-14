import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

interface Slide {
  image: string;
  // inline CSS gradient — Tailwind JIT cannot detect class strings inside JS objects
  overlayStyle: React.CSSProperties;
  fallbackBg: string; // solid colour shown if image is absent/broken
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  cta: { label: { ar: string; en: string }; href: string };
}

const SLIDES: Slide[] = [
  {
    image: '/hero-damascus.png',
    overlayStyle: {
      background:
        'linear-gradient(to bottom, rgba(26,10,0,0.08), rgba(26,10,0,0.22), rgba(26,10,0,0.76))',
    },
    fallbackBg: '#1a1208',
    title: { ar: 'دمشق', en: 'Damascus' },
    subtitle: { ar: 'قلب سوريا وعاصمتها الأبدية', en: 'The heart and eternal capital of Syria' },
    cta: {
      label: { ar: 'تصفح عقارات دمشق', en: 'Browse Damascus' },
      href: `${PATHS.properties}?city=damascus`,
    },
  },
  {
    image: '/hero-aleppo.png',
    overlayStyle: {
      background:
        'linear-gradient(to bottom, rgba(28,14,0,0.08), rgba(40,20,0,0.22), rgba(28,14,0,0.78))',
    },
    fallbackBg: '#1c1006',
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
    image: '/hero-homs.png',
    overlayStyle: {
      background:
        'linear-gradient(to bottom, rgba(20,12,0,0.08), rgba(32,18,0,0.22), rgba(20,12,0,0.78))',
    },
    fallbackBg: '#191008',
    title: { ar: 'حمص', en: 'Homs' },
    subtitle: {
      ar: 'أم الحجارة السوداء وعاصمة الوسط',
      en: 'City of black stones and heart of Syria',
    },
    cta: {
      label: { ar: 'تصفح عقارات حمص', en: 'Browse Homs' },
      href: `${PATHS.properties}?city=homs`,
    },
  },
  {
    image: '/hero-latakia.png',
    overlayStyle: {
      background:
        'linear-gradient(to bottom, rgba(0,16,32,0.08), rgba(0,24,48,0.22), rgba(0,16,32,0.78))',
    },
    fallbackBg: '#001828',
    title: { ar: 'اللاذقية', en: 'Latakia' },
    subtitle: { ar: 'جوهرة الساحل السوري', en: 'Pearl of the Syrian coast' },
    cta: {
      label: { ar: 'تصفح عقارات اللاذقية', en: 'Browse Latakia' },
      href: `${PATHS.properties}?city=latakia`,
    },
  },
  {
    image: '/hero-tartus.png',
    overlayStyle: {
      background:
        'linear-gradient(to bottom, rgba(0,12,28,0.08), rgba(0,18,40,0.22), rgba(0,12,28,0.78))',
    },
    fallbackBg: '#000e1e',
    title: { ar: 'طرطوس', en: 'Tartus' },
    subtitle: { ar: 'منتجع الشاطئ الأزرق السوري', en: "Syria's blue beach resort city" },
    cta: {
      label: { ar: 'تصفح عقارات طرطوس', en: 'Browse Tartus' },
      href: `${PATHS.properties}?city=tartus`,
    },
  },
];

const AUTO_PLAY_MS = 5000;

const contentVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: 0.2 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: 'easeIn' as const } },
};

const arrowBase =
  'absolute top-1/2 z-30 flex -translate-y-1/2 items-center justify-center ' +
  'rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md ' +
  'transition-all duration-300 hover:scale-110 hover:bg-white/30 ' +
  'h-9 w-9 md:h-11 md:w-11';

export function HeroCarousel() {
  const { locale, isRTL } = useI18n();
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 38,
    direction: isRTL ? 'rtl' : 'ltr',
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

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
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] md:aspect-[16/9] md:rounded-3xl lg:aspect-[21/9]">
          {/* ── Embla viewport ── */}
          <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">
              {SLIDES.map((s, i) => (
                <div
                  key={i}
                  className="relative h-full min-w-0 flex-[0_0_100%]"
                  style={{ backgroundColor: s.fallbackBg }}
                >
                  {/* City image */}
                  {!imgErrors[i] && (
                    <img
                      src={s.image}
                      alt={s.title[locale]}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                    />
                  )}
                  {/* Cinematic gradient overlay — inline style bypasses Tailwind JIT limitation */}
                  <div className="absolute inset-0" style={s.overlayStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Slide content with Framer Motion fade ── */}
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
                  className="rounded-full border border-white/55 bg-white/10 px-5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 md:px-7 md:py-2.5 md:text-sm"
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
