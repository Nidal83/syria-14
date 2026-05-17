import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface Props {
  status: string;
  className?: string;
}

export function PropertyStatusBadge({ status, className }: Props) {
  const { t } = useI18n();

  const label =
    status === 'active'
      ? t.property.statuses.active
      : status === 'hidden'
        ? t.property.statuses.hidden
        : status === 'sold'
          ? t.property.statuses.sold
          : status === 'rented'
            ? t.property.statuses.rented
            : status === 'inactive'
              ? t.property.statuses.inactive
              : t.property.statuses.pending;

  const variant = status === 'active' ? 'default' : status === 'hidden' ? 'secondary' : 'outline';

  return (
    <Badge
      variant={variant}
      className={cn(
        status === 'active' && 'bg-green-600 text-white hover:bg-green-600',
        status === 'hidden' && 'text-muted-foreground',
        className,
      )}
    >
      {label}
    </Badge>
  );
}
