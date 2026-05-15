import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';

// ─── Property Favorites ───────────────────────────────────────────────────────

export function useFavoritePropertyIds() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['favorite-property-ids', profile?.id],
    queryFn: async () => {
      if (!profile) return new Set<string>();
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', profile.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.property_id));
    },
    enabled: Boolean(profile),
    staleTime: 1000 * 60,
  });
}

export function useToggleFavoriteProperty() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      isFavorited,
    }: {
      propertyId: string;
      isFavorited: boolean;
    }) => {
      if (!profile) throw new Error('Not authenticated');

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', profile.id)
          .eq('property_id', propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: profile.id, property_id: propertyId });
        if (error) throw error;
      }

      return { propertyId, isFavorited };
    },
    onMutate: async ({ propertyId, isFavorited }) => {
      await qc.cancelQueries({ queryKey: ['favorite-property-ids', profile?.id] });
      const prev = qc.getQueryData<Set<string>>(['favorite-property-ids', profile?.id]);

      qc.setQueryData(['favorite-property-ids', profile?.id], (old: Set<string> | undefined) => {
        const next = new Set(old ?? []);
        if (isFavorited) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['favorite-property-ids', profile?.id], ctx.prev);
      }
    },
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? t.common.removedFromFavorites : t.common.savedToFavorites);
      qc.invalidateQueries({ queryKey: ['favorite-properties'] });
    },
  });
}

export function useFavoriteProperties() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['favorite-properties', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id, properties(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => r.properties)
        .filter(Boolean)
        .map((p) => ({ ...p, bedrooms: p!.rooms }));
    },
    enabled: Boolean(profile),
    staleTime: 1000 * 60,
  });
}

// ─── Office Favorites ─────────────────────────────────────────────────────────

export function useFavoriteOfficeIds() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['favorite-office-ids', profile?.id],
    queryFn: async () => {
      if (!profile) return new Set<string>();
      const { data, error } = await supabase
        .from('favorite_offices')
        .select('office_id')
        .eq('user_id', profile.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.office_id));
    },
    enabled: Boolean(profile),
    staleTime: 1000 * 60,
  });
}

export function useToggleFavoriteOffice() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ officeId, isFavorited }: { officeId: string; isFavorited: boolean }) => {
      if (!profile) throw new Error('Not authenticated');

      if (isFavorited) {
        const { error } = await supabase
          .from('favorite_offices')
          .delete()
          .eq('user_id', profile.id)
          .eq('office_id', officeId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_offices')
          .insert({ user_id: profile.id, office_id: officeId });
        if (error) throw error;
      }

      return { officeId, isFavorited };
    },
    onMutate: async ({ officeId, isFavorited }) => {
      await qc.cancelQueries({ queryKey: ['favorite-office-ids', profile?.id] });
      const prev = qc.getQueryData<Set<string>>(['favorite-office-ids', profile?.id]);

      qc.setQueryData(['favorite-office-ids', profile?.id], (old: Set<string> | undefined) => {
        const next = new Set(old ?? []);
        if (isFavorited) next.delete(officeId);
        else next.add(officeId);
        return next;
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['favorite-office-ids', profile?.id], ctx.prev);
      }
    },
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? t.common.removedFromFavorites : t.common.savedToFavorites);
      qc.invalidateQueries({ queryKey: ['favorite-offices-full'] });
    },
  });
}

export function useFavoriteOffices() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['favorite-offices-full', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('favorite_offices')
        .select('office_id, offices(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => r.offices).filter(Boolean);
    },
    enabled: Boolean(profile),
    staleTime: 1000 * 60,
  });
}
