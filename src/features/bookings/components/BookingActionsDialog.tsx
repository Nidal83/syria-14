import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n/context';
import { useUpdateBookingStatus } from '../hooks/useUpdateBookingStatus';
import type { OfficeBooking } from '../api/bookings.service';

const REJECT_NOTE_MIN = 5;

interface Props {
  booking: OfficeBooking | null;
  mode: 'confirm' | 'reject' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingActionsDialog({ booking, mode, open, onOpenChange }: Props) {
  const { t } = useI18n();
  const { mutate, isPending } = useUpdateBookingStatus();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setNote('');
    setError(null);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!booking || !mode) return;
    const trimmed = note.trim();

    if (mode === 'reject' && trimmed.length < REJECT_NOTE_MIN) {
      setError(t.bookings.reject.notePlaceholder);
      return;
    }

    mutate(
      {
        bookingId: booking.id,
        newStatus: mode === 'confirm' ? 'confirmed' : 'rejected',
        note: trimmed || undefined,
        propertyId: booking.property_id,
      },
      {
        onSuccess: () => {
          toast.success(
            mode === 'confirm' ? t.bookings.toast.confirmed : t.bookings.toast.rejected,
          );
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error(t.bookings.toast.failed),
      },
    );
  }

  const isReject = mode === 'reject';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReject ? t.bookings.reject.title : t.bookings.confirm.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="booking-note">
            {isReject ? t.bookings.reject.noteLabel : t.bookings.confirm.noteLabel}
          </Label>
          <Textarea
            id="booking-note"
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            placeholder={isReject ? t.bookings.reject.notePlaceholder : undefined}
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isReject ? t.bookings.actions.reject : t.bookings.actions.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
