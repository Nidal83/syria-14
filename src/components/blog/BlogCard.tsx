import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import type { BlogPost } from '@/data/blog-posts';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export function BlogCard({ post, index = 0 }: BlogCardProps) {
  const { locale, isRTL, t } = useI18n();

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.1 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <Link to={PATHS.blogPost(post.slug)} className="relative block overflow-hidden">
        <div className="aspect-[16/9] bg-[#e8e4dc]">
          <img
            src={post.image}
            alt={post.title[locale]}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        {/* Category badge */}
        <span className="absolute start-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1F2C3D] backdrop-blur-sm">
          {post.category[locale]}
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta */}
        <div className="mb-3 flex items-center gap-3 text-xs text-[#6b7280]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime[locale]}
          </span>
        </div>

        {/* Title */}
        <Link to={PATHS.blogPost(post.slug)}>
          <h3 className="mb-2 text-base font-bold leading-snug text-[#1F2C3D] transition-colors group-hover:text-[#2d5a8e] md:text-lg">
            {post.title[locale]}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[#6b7280]">
          {post.excerpt[locale]}
        </p>

        {/* Read more */}
        <Link
          to={PATHS.blogPost(post.slug)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F2C3D] transition-colors hover:text-[#2d5a8e]"
        >
          {t.blog.readMore}
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}
