import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n/context';
import { useNotifications } from '../hooks/use-notifications';
import { useMarkRead } from '../hooks/use-mark-read';
import type { Notification } from '../types';
import { cn } from '@/lib/utils';

function relativeTime(iso: string, locale: string) {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: locale === 'ar' ? arLocale : enUS,
    });
  } catch {
    return '';
  }
}

function NotifRow({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string, link: string | null) => void;
}) {
  const { locale } = useI18n();
  const isRead = Boolean(notif.read_at);

  return (
    <button
      onClick={() => onRead(notif.id, notif.link)}
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2.5 text-start transition-colors hover:bg-accent',
        !isRead && 'bg-primary/5',
      )}
    >
      {/* Unread indicator */}
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          isRead ? 'bg-transparent' : 'bg-primary',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', !isRead && 'font-semibold')}>{notif.title}</p>
        {notif.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notif.body}</p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {relativeTime(notif.created_at, locale)}
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const { markOne, markAll } = useMarkRead();

  const unread = notifications.filter((n) => !n.read_at).length;

  function handleRead(id: string, link: string | null) {
    markOne.mutate(id);
    if (link) navigate(link);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
          <span className="sr-only">{t.notifications.title}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="text-sm font-semibold">{t.notifications.title}</p>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-primary hover:underline"
            >
              {t.notifications.markAllRead}
            </button>
          )}
        </div>

        <Separator />

        {/* List */}
        {isLoading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{t.common.loading}</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t.notifications.empty}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((n, i) => (
              <div key={n.id}>
                <NotifRow notif={n} onRead={handleRead} />
                {i < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
