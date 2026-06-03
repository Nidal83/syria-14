import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CalendarX2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { useOfficeBookings } from '@/features/bookings/hooks/useOfficeBookings';
import { BookingListItem } from '@/features/bookings/components/BookingListItem';
import { BookingActionsDialog } from '@/features/bookings/components/BookingActionsDialog';
import type { OfficeBooking, BookingStatus } from '@/features/bookings/api/bookings.service';

type TabKey = 'all' | 'pending' | 'confirmed' | 'past';

const PAST_STATUSES: BookingStatus[] = ['rejected', 'cancelled', 'completed'];

function matchesTab(tab: TabKey, status: BookingStatus): boolean {
  if (tab === 'all') return true;
  if (tab === 'pending') return status === 'pending';
  if (tab === 'confirmed') return status === 'confirmed';
  return PAST_STATUSES.includes(status);
}

export default function BookingsPage() {
  const { t } = useI18n();
  const { data: bookings = [], isLoading } = useOfficeBookings();
  const [tab, setTab] = useState<TabKey>('all');

  const [dialogBooking, setDialogBooking] = useState<OfficeBooking | null>(null);
  const [dialogMode, setDialogMode] = useState<'confirm' | 'reject' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(booking: OfficeBooking, mode: 'confirm' | 'reject') {
    setDialogBooking(booking);
    setDialogMode(mode);
    setDialogOpen(true);
  }

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      past: bookings.filter((b) => PAST_STATUSES.includes(b.status)).length,
    }),
    [bookings],
  );

  const visible = useMemo(() => bookings.filter((b) => matchesTab(tab, b.status)), [bookings, tab]);

  const tabs: TabKey[] = ['all', 'pending', 'confirmed', 'past'];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.bookings.title}</h1>
        <p className="text-muted-foreground">
          {t.bookings.subtitle}
          {counts.pending > 0 && (
            <span className="ms-2 font-medium text-amber-700">
              · {counts.pending} {t.bookings.tabs.pending}
            </span>
          )}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          {tabs.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t.bookings.tabs[key]}
              <span className="ms-1.5 rounded-full bg-muted-foreground/15 px-1.5 text-xs">
                {counts[key]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <CalendarX2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="mb-4 text-muted-foreground">{t.bookings.list.empty}</p>
              <Button asChild variant="outline">
                <Link to={PATHS.officeProperties}>{t.office.myProperties}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((booking) => (
                <BookingListItem
                  key={booking.id}
                  booking={booking}
                  onConfirm={(b) => openDialog(b, 'confirm')}
                  onReject={(b) => openDialog(b, 'reject')}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BookingActionsDialog
        booking={dialogBooking}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
