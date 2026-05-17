import { supabase } from '@/integrations/supabase/client';
import type { CreatePropertyValues } from '../schemas/property.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Office {
  id: string;
}

export interface CreatedProperty {
  id: string;
}

// ─── Geography ────────────────────────────────────────────────────────────────

export interface Governorate {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
}

export interface Area {
  id: string;
  governorate_id: string;
  key: string;
  name_ar: string;
  name_en: string;
}

export async function fetchGovernorates(): Promise<Governorate[]> {
  const { data, error } = await supabase
    .from('governorates')
    .select('id, key, name_ar, name_en')
    .order('name_ar');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAreasByGovernorate(governorateId: string): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id, governorate_id, key, name_ar, name_en')
    .eq('governorate_id', governorateId)
    .order('name_ar');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Office lookup ────────────────────────────────────────────────────────────

export async function getMyOffice(userId: string): Promise<Office | null> {
  const { data, error } = await supabase
    .from('offices')
    .select('id')
    .eq('owner_id', userId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Property insert ──────────────────────────────────────────────────────────

type PropertyInsert = Omit<CreatePropertyValues, 'images'> & {
  office_id: string;
  status: string;
  city: string;
  furnished: boolean;
};

export async function insertProperty(payload: PropertyInsert): Promise<CreatedProperty> {
  const { images: _images, ...rest } = payload as PropertyInsert & { images?: unknown };
  void _images;

  const { data, error } = await supabase
    .from('properties')
    .insert({
      title: rest.title,
      description: rest.description,
      property_type: rest.property_type,
      listing_type: rest.listing_type,
      price: rest.price,
      currency: rest.currency,
      governorate_id: rest.governorate_id,
      area_id: rest.area_id,
      address: rest.address,
      area_size: rest.area_size,
      rooms: rest.rooms,
      bathrooms: rest.bathrooms,
      living_rooms: rest.living_rooms ?? 0,
      kitchens: rest.kitchens ?? 1,
      ...(rest.floor !== undefined && { floor: rest.floor }),
      ...(rest.total_floors !== undefined && { total_floors: rest.total_floors }),
      ...(rest.building_age !== undefined && { building_age: rest.building_age }),
      direction: rest.direction ?? '',
      view: rest.view ?? '',
      features: rest.features,
      furnished: rest.furnished,
      payment_method: rest.payment_method ?? '',
      ownership_type: rest.ownership_type ?? '',
      contact_phone: rest.contact_phone,
      whatsapp: rest.whatsapp ?? '',
      video_url: rest.video_url ?? '',
      office_id: rest.office_id,
      status: rest.status,
      city: rest.city,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Update featured_image after upload ──────────────────────────────────────

export async function updateFeaturedImage(propertyId: string, url: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ featured_image: url })
    .eq('id', propertyId);
  if (error) throw new Error(error.message);
}
