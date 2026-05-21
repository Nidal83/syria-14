import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { BLOG_POSTS } from '@/data/blog-posts';
import { BlogCard } from './BlogCard';

export function BlogSection() {
  const { t, isRTL } = useI18n();
  const latest = BLOG_POSTS.slice(0, 3);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="bg-[#f5f3ef] py-14 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
              {t.blog.sectionTitle}
            </p>
            <h2 className="text-2xl font-bold text-[#1F2C3D] md:text-3xl">
              {t.blog.sectionSubtitle}
            </h2>
          </div>
          <Link
            to={PATHS.blog}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#1F2C3D]/20 px-5 py-2 text-sm font-semibold text-[#1F2C3D] transition hover:bg-[#1F2C3D] hover:text-white"
          >
            {t.blog.viewAll}
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {latest.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
