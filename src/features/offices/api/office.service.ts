import { supabase } from '@/integrations/supabase/client';

export interface CurrentOffice {
  id: string;
  office_name: string;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  description: string;
  address: string;
  governorate_id: string | null;
  area_id: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficePatch {
  office_name?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  description?: string;
  governorate_id?: string | null;
  area_id?: string | null;
}

export interface OfficeStats {
  total: number;
  active: number;
  hidden: number;
  sold: number;
}

export async function getCurrentOffice(userId: string): Promise<CurrentOffice | null> {
  const { data, error } = await supabase
    .from('offices')
    .select(
      'id, office_name, owner_name, email, phone, whatsapp, description, address, governorate_id, area_id, status, is_active, created_at, updated_at',
    )
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCurrentOffice(userId: string, patch: OfficePatch): Promise<void> {
  const { error } = await supabase
    .from('offices')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('owner_id', userId);
  if (error) throw new Error(error.message);
}

export async function getOfficeStats(officeId: string): Promise<OfficeStats> {
  const { data, error } = await supabase
    .from('properties')
    .select('status')
    .eq('office_id', officeId);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    hidden: rows.filter((r) => r.status === 'hidden').length,
    sold: rows.filter((r) => r.status === 'sold' || r.status === 'rented').length,
  };
}
