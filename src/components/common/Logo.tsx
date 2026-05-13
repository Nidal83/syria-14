import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact }: Props) {
  const { t } = useI18n();

  return (
    <Link
      to={PATHS.home}
      className={cn('flex items-center gap-2 font-bold text-primary', className)}
    >
      {/* Icon mark */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
        SH
      </div>
      {!compact && <span className="text-lg leading-tight">{t.common.appName}</span>}
    </Link>
  );
}
