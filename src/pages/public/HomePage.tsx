import SearchBox from '@/components/SearchBox';
import { useI18n } from '@/lib/i18n/context';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden">
        {/* Damascus photo — place at public/hero-damascus.jpg */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/hero-damascus.jpg')` }}
        />

        {/* Multi-layer overlay: bottom-heavy dark for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        {/* Extra gold warm tint at horizon -->
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d1f00]/50 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full px-4 pb-16 pt-8">
          {/* Hero text */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl sm:text-4xl lg:text-5xl xl:text-6xl">
              {t.search.heroTitle}
            </h1>
            <p className="mt-4 text-base text-white/80 drop-shadow-md sm:text-lg lg:text-xl">
              {t.search.heroSubtitle}
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto max-w-4xl">
            <SearchBox />
          </div>
        </div>
      </section>
    </div>
  );
}
