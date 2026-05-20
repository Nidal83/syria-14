import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** 'light' = bright/white logo for dark (Navy/Charcoal) backgrounds.
   *  'dark'  = dark/navy logo for light (Ivory/White) backgrounds. */
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Set to true for the above-the-fold header logo (disables lazy loading). */
  eager?: boolean;
}

const sizeMap = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-18',
} as const;

const heightPx = { sm: 32, md: 48, lg: 72 } as const;

export function Logo({ variant = 'dark', size = 'md', className, eager }: LogoProps) {
  // Prefer the purpose-built file; fall back to the single-file logo.
  // - 'light' variant (for dark bg): /logo-dark.png → fallback /logo-syria14.png inverted
  // - 'dark'  variant (for light bg): /logo-light.png → fallback /logo-syria14.png as-is
  const primarySrc = variant === 'light' ? '/logo-dark.png' : '/logo-light.png';
  const fallbackSrc = '/logo-syria14.png';

  const [src, setSrc] = useState(primarySrc);
  const [usedFallback, setUsedFallback] = useState(false);

  function handleError() {
    if (!usedFallback) {
      setSrc(fallbackSrc);
      setUsedFallback(true);
    }
  }

  return (
    <Link
      to={PATHS.home}
      className={cn('inline-flex shrink-0 items-center', className)}
      aria-label="Syria 14 — Unlock Your Perfect Stay"
    >
      <img
        src={src}
        alt="Syria 14 — Unlock Your Perfect Stay"
        height={heightPx[size]}
        loading={eager ? 'eager' : 'lazy'}
        onError={handleError}
        className={cn(
          'w-auto object-contain',
          sizeMap[size],
          // When using the fallback file, apply a CSS filter so it reads
          // on dark backgrounds until the user supplies logo-dark.png.
          usedFallback && variant === 'light' && 'brightness-0 invert',
        )}
      />
    </Link>
  );
}
