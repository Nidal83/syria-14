import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  compact?: boolean;
  /** Use on dark backgrounds (hero, dark nav) */
  light?: boolean;
}

export function Logo({ className, compact, light }: Props) {
  return (
    <Link
      to={PATHS.home}
      className={cn('flex shrink-0 items-center', className)}
      aria-label="Syria 14"
    >
      {compact ? (
        /* Icon-only mode: just the house+key symbol from the logo */
        <img
          src="/logo-syria14.png"
          alt="Syria 14"
          className="h-9 w-9 object-contain"
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = 'none';
            const fallback = t.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : (
        <img
          src="/logo-syria14.png"
          alt="Syria 14"
          className={cn(
            'object-contain',
            light ? 'brightness-0 invert' : '',
            'h-10 w-auto max-w-[140px]',
          )}
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = 'none';
            const fallback = t.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      )}

      {/* Text fallback (shown only if image fails to load) */}
      <span
        style={{ display: 'none' }}
        className={cn(
          'items-center gap-2 font-black tracking-tight',
          light ? 'text-white' : 'text-foreground',
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black"
          style={{ background: 'hsl(38 70% 46%)', color: '#fff' }}
        >
          S14
        </span>
        {!compact && <span style={{ color: 'hsl(38 70% 46%)', fontSize: '1.1rem' }}>Syria 14</span>}
      </span>
    </Link>
  );
}
