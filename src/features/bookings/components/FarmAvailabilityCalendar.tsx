import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DayContent, type DayContentProps } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { listBookingsForProperty } from '../api/bookings.service';
import type { BookingStatus } from '../api/bookings.service';
import { parseISO, toKey, expandRange } from '../lib/dates';

interface Props {
  propertyId: string;
  height?: 'sm' | 'md';
}

/**
 * Read-only availability calendar for a farm property. Pending/confirmed
 * bookings are expanded into a set of booked dates (red); every other day is
 * tinted green (available). No date selection here — that is the customer-side
 * flow in Feature 2c.
 */
export function FarmAvailabilityCalendar({ propertyId, height = 'md' }: Props) {
  const { t } = useI18n();

  const { data: ranges = [], isLoading } = useQuery({
    queryKey: ['property-bookings', propertyId],
    queryFn: () => listBookingsForProperty(propertyId),
    staleTime: 30_000,
  });

  const { bookedDates, statusByKey } = useMemo(() => {
    const status = new Map<string, BookingStatus>();
    for (const r of ranges) {
      for (const key of expandRange(r.start_date, r.end_date)) {
        // Confirmed outranks pending when both touch the same day.
        if (status.get(key) !== 'confirmed') status.set(key, r.status);
      }
    }
    return {
      bookedDates: [...status.keys()].map(parseISO),
      statusByKey: status,
    };
  }, [ranges]);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d;
  }, []);

  function renderDay(props: DayContentProps) {
    const status = statusByKey.get(toKey(props.date));
    if (!status) return <DayContent {...props} />;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex h-full w-full items-center justify-center">
            <DayContent {...props} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{t.bookings.status[status]}</TooltipContent>
      </Tooltip>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        <Calendar
          mode="default"
          toDate={maxDate}
          modifiers={{
            booked: bookedDates,
            available: (date: Date) => !statusByKey.has(toKey(date)),
          }}
          modifiersClassNames={{
            booked: 'bg-red-100 text-red-900 font-semibold rounded-md',
            available: 'bg-green-50/60 rounded-md',
          }}
          components={{ DayContent: renderDay }}
          className={height === 'sm' ? 'text-xs' : undefined}
        />

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
            {t.calendar.legend.available}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            {t.calendar.legend.booked}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
