import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { markAsRead, markAllAsRead } from '../api/notifications.service';
import type { Notification } from '../types';

const QUERY_KEY = ['notifications'];

export function useMarkRead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const markOne = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(QUERY_KEY);
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (old) =>
        old ? old.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)) : old,
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx?.previous);
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllAsRead(profile!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(QUERY_KEY);
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (old) =>
        old ? old.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx?.previous);
    },
  });

  return { markOne, markAll };
}
