import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { usePageSeo } from '@/hooks/usePageSeo';
import { getPostBySlug, getRelatedPosts } from '@/data/blog-posts';
import { BlogCard } from '@/components/blog/BlogCard';
import { PATHS } from '@/routes/paths';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, isRTL, t } = useI18n();

  const post = getPostBySlug(slug ?? '');
  const related = getRelatedPosts(slug ?? '');

  usePageSeo({
    title: post ? (locale === 'ar' ? post.seo.titleAr : post.seo.titleEn) : t.blog.notFound,
    description: post ? (locale === 'ar' ? post.seo.descriptionAr : post.seo.descriptionEn) : '',
    ogImage: post?.image,
  });

  if (!post) return <Navigate to={PATHS.blog} replace />;

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title[locale], url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero image ── */}
      <div className="relative h-64 w-full overflow-hidden bg-[#1F2C3D] md:h-96 lg:h-[480px]">
        <img
          src={post.image}
          alt={post.title[locale]}
          className="h-full w-full object-cover object-center opacity-70"
          loading="eager"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2C3D]/80 via-transparent to-transparent" />

        {/* Back link */}
        <Link
          to={PATHS.blog}
          className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/35 md:start-8"
        >
          <BackIcon className="h-4 w-4" />
          {t.blog.backToBlog}
        </Link>

        {/* Category + date overlay */}
        <div className="absolute bottom-6 start-4 md:start-8">
          <span className="mb-2 inline-block rounded-full bg-[#D8C4A8] px-3 py-1 text-xs font-semibold text-[#1F2C3D]">
            {post.category[locale]}
          </span>
        </div>
      </div>

      {/* ── Article body ── */}
      <div className="container pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-3xl">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mb-4 text-2xl font-bold leading-tight text-[#1F2C3D] md:text-4xl lg:text-5xl"
          >
            {post.title[locale]}
          </motion.h1>

          {/* Meta bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-[#e8e4dc] pb-6 text-sm text-[#6b7280]">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {t.blog.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime[locale]}
            </span>
            <button
              onClick={handleShare}
              className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-[#e8e4dc] px-4 py-1.5 text-xs font-medium transition hover:bg-[#f5f3ef]"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t.blog.shareArticle}
            </button>
          </div>

          {/* Excerpt lead */}
          <p className="mb-10 text-base font-medium leading-relaxed text-[#374151] md:text-lg">
            {post.excerpt[locale]}
          </p>

          {/* Table of contents */}
          <nav className="mb-10 rounded-2xl bg-[#f5f3ef] p-5 md:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
              {t.blog.tableOfContents}
            </p>
            <ol className="space-y-2">
              {post.sections.map((sec, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="flex items-baseline gap-2 text-sm text-[#1F2C3D] transition hover:text-[#2d5a8e]"
                  >
                    <span className="shrink-0 text-xs font-bold text-[#9ca3af]">{i + 1}.</span>
                    {sec.heading[locale]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Article sections */}
          <div className="space-y-10">
            {post.sections.map((sec, i) => (
              <motion.section
                key={i}
                id={`section-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <h2 className="mb-3 text-xl font-bold text-[#1F2C3D] md:text-2xl">
                  {sec.heading[locale]}
                </h2>
                <p className="leading-loose text-[#374151] md:text-base">{sec.body[locale]}</p>
              </motion.section>
            ))}
          </div>

          {/* Share footer */}
          <div className="mt-12 flex items-center justify-between border-t border-[#e8e4dc] pt-8">
            <Link
              to={PATHS.blog}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F2C3D] transition hover:text-[#2d5a8e]"
            >
              <BackIcon className="h-4 w-4" />
              {t.blog.backToBlog}
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1F2C3D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2d5a8e]"
            >
              <Share2 className="h-4 w-4" />
              {t.blog.shareArticle}
            </button>
          </div>
        </div>
      </div>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <div className="bg-[#f5f3ef] py-12 md:py-16">
          <div className="container">
            <h2 className="mb-8 text-xl font-bold text-[#1F2C3D] md:text-2xl">
              {t.blog.relatedArticles}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {related.map((p, i) => (
                <BlogCard key={p.slug} post={p} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
