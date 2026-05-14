import SearchBox from '@/components/SearchBox';
import { useI18n } from '@/lib/i18n/context';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden">
        {/* Background: Damascus skyline SVG */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/hero-syria.svg')` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        {/* Content */}
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto mb-8 max-w-2xl text-center text-white">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight drop-shadow-lg sm:text-4xl lg:text-5xl">
              {t.search.heroTitle}
            </h1>
            <p className="mt-3 text-base text-white/80 drop-shadow sm:text-lg">
              {t.search.heroSubtitle}
            </p>
          </div>

          {/* SearchBox card — centered, max-width */}
          <div className="mx-auto max-w-4xl">
            <SearchBox />
          </div>
        </div>
      </section>
    </div>
  );
}
