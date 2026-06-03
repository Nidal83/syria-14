import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '../api/bookings.service';

const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-green-100 text-green-900 border-green-200',
  rejected: 'bg-red-100 text-red-900 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-blue-100 text-blue-900 border-blue-200',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_CLASSES[status],
      )}
    >
      {t.bookings.status[status]}
    </span>
  );
}
