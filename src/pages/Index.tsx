import { useLanguage } from '@/i18n/LanguageContext';
import SearchBox from '@/components/SearchBox';
import PropertyCard from '@/components/PropertyCard';
import { useProperties } from '@/hooks/useProperties';
import { Building2, Users, Shield, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import heroDamascus from '@/assets/hero-damascus.jpg';

const Index = () => {
  const { lang, t } = useLanguage();
  const { properties, loading } = useProperties();
  const featured = properties.slice(0, 6);

  const stats = [
    { icon: Building2, value: '2,500+', label: { ar: 'عقار متاح', en: 'Properties' } },
    { icon: Users, value: '150+', label: { ar: 'مكتب عقاري', en: 'Offices' } },
    { icon: Shield, value: '100%', label: { ar: 'موثوق', en: 'Verified' } },
    { icon: TrendingUp, value: '10K+', label: { ar: 'مستخدم نشط', en: 'Active Users' } },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden py-16 md:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroDamascus})` }}
        />
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-8 max-w-3xl text-center"
          >
            <h1 className="mb-4 text-3xl font-bold leading-tight text-primary-foreground md:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-primary-foreground/80">{t('hero.subtitle')}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-4xl"
          >
            <SearchBox />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="flex flex-col items-center text-center"
              >
                <stat.icon className="mb-2 h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label[lang]}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">
            {lang === 'ar' ? 'عقارات مميزة' : 'Featured Properties'}
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-xl bg-card p-12 text-center shadow-card">
              <p className="text-muted-foreground">{t('search.no_results')}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, i) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
