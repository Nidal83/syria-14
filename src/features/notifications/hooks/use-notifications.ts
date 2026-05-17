import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { listMyNotifications } from '../api/notifications.service';
import type { Notification } from '../types';

const QUERY_KEY = ['notifications'];

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listMyNotifications(20),
    enabled: Boolean(profile),
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;

          // Prepend to cache
          queryClient.setQueryData<Notification[]>(QUERY_KEY, (old) =>
            old ? [incoming, ...old] : [incoming],
          );

          // Transient toast
          toast(incoming.title, {
            description: incoming.body ?? undefined,
          });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, queryClient, t]);

  return query;
}
