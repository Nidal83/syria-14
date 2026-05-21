import { useI18n } from '@/lib/i18n/context';
import { usePageSeo } from '@/hooks/usePageSeo';
import { BLOG_POSTS } from '@/data/blog-posts';
import { BlogCard } from '@/components/blog/BlogCard';

export default function BlogListPage() {
  const { locale, t } = useI18n();

  usePageSeo({
    title:
      locale === 'ar'
        ? 'المدونة — ثقافة وتاريخ وعقارات في سوريا | سيريا 14'
        : 'Blog — Culture, History & Real Estate in Syria | Syria 14',
    description:
      locale === 'ar'
        ? 'أحدث المقالات حول الثقافة السورية والتاريخ والاستثمار العقاري من فريق سيريا 14'
        : 'Latest articles on Syrian culture, history and real estate investment from the Syria 14 team',
  });

  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      {/* Page header */}
      <div className="bg-[#1F2C3D] py-14 text-center md:py-20">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#D8C4A8]/70">
          Syria 14
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          {t.blog.pageTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base">
          {t.blog.pageSubtitle}
        </p>
      </div>

      {/* Articles grid */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
