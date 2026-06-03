import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { CreatePropertyValues } from '../schemas/property.schema';

type PropertyStatus = Database['public']['Enums']['property_status'];

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
  status: PropertyStatus;
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
      // Farms have no single price — surface the daily tier (falling back to
      // weekly/monthly) so the listing card still shows a number.
      price:
        rest.property_type === 'farm'
          ? (rest.daily_price ?? rest.weekly_price ?? rest.monthly_price ?? 0)
          : (rest.price ?? 0),
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
      // Farm pricing — persisted only for farm listings; nulled otherwise so
      // the row stays clean when the type changes.
      daily_price: rest.property_type === 'farm' ? (rest.daily_price ?? null) : null,
      weekly_price: rest.property_type === 'farm' ? (rest.weekly_price ?? null) : null,
      monthly_price: rest.property_type === 'farm' ? (rest.monthly_price ?? null) : null,
      min_booking_days: rest.property_type === 'farm' ? (rest.min_booking_days ?? null) : null,
      max_booking_days: rest.property_type === 'farm' ? (rest.max_booking_days ?? null) : null,
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

// ─── Office property list ─────────────────────────────────────────────────────

export interface OfficeProperty {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: PropertyStatus;
  listing_type: string;
  property_type: string;
  rooms: number;
  bathrooms: number;
  area_size: number;
  governorate_id: string | null;
  area_id: string | null;
  featured_image: string | null;
  created_at: string;
  governorates: { name_ar: string; name_en: string } | null;
  areas: { name_ar: string; name_en: string } | null;
  property_images: { image_url: string; is_cover: boolean }[];
}

export async function listOfficeProperties(officeId: string): Promise<OfficeProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `id, title, price, currency, status, listing_type, property_type,
       rooms, bathrooms, area_size, governorate_id, area_id, featured_image, created_at,
       governorates(name_ar, name_en),
       areas(name_ar, name_en),
       property_images(image_url, is_cover)`,
    )
    .eq('office_id', officeId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OfficeProperty[];
}

export async function updatePropertyStatus(
  propertyId: string,
  status: 'active' | 'hidden',
): Promise<void> {
  const { error } = await supabase.from('properties').update({ status }).eq('id', propertyId);
  if (error) throw new Error(error.message);
}

// ─── Fetch full property for editing ─────────────────────────────────────────

export interface ExistingImage {
  id: string;
  image_url: string;
  is_cover: boolean;
}

export interface PropertyForEdit {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: 'sale' | 'rent';
  price: number;
  currency: string;
  governorate_id: string | null;
  area_id: string | null;
  address: string | null;
  area_size: number | null;
  rooms: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  kitchens: number | null;
  floor: number | null;
  total_floors: number | null;
  building_age: number | null;
  direction: string | null;
  view: string | null;
  features: string[] | null;
  furnished: boolean;
  payment_method: string | null;
  ownership_type: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  video_url: string | null;
  office_id: string;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  min_booking_days: number | null;
  max_booking_days: number | null;
  property_images: ExistingImage[];
}

export async function fetchPropertyForEdit(propertyId: string): Promise<PropertyForEdit> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `id, title, description, property_type, listing_type, price, currency,
       governorate_id, area_id, address, area_size, rooms, bathrooms,
       living_rooms, kitchens, floor, total_floors, building_age,
       direction, view, features, furnished, payment_method, ownership_type,
       contact_phone, whatsapp, video_url, office_id,
       daily_price, weekly_price, monthly_price, min_booking_days, max_booking_days,
       property_images(id, image_url, is_cover)`,
    )
    .eq('id', propertyId)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as PropertyForEdit;
}

// ─── Update property fields ───────────────────────────────────────────────────

type PropertyUpdate = Omit<PropertyForEdit, 'id' | 'property_images'>;

export async function updatePropertyFields(
  propertyId: string,
  payload: PropertyUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({
      title: payload.title,
      description: payload.description,
      property_type: payload.property_type,
      listing_type: payload.listing_type,
      price: payload.price,
      currency: payload.currency,
      governorate_id: payload.governorate_id,
      area_id: payload.area_id,
      address: payload.address,
      area_size: payload.area_size,
      rooms: payload.rooms,
      bathrooms: payload.bathrooms,
      living_rooms: payload.living_rooms ?? 0,
      kitchens: payload.kitchens ?? 1,
      floor: payload.floor,
      total_floors: payload.total_floors,
      building_age: payload.building_age,
      direction: payload.direction ?? '',
      view: payload.view ?? '',
      features: payload.features ?? [],
      furnished: payload.furnished,
      payment_method: payload.payment_method ?? '',
      ownership_type: payload.ownership_type ?? '',
      contact_phone: payload.contact_phone,
      whatsapp: payload.whatsapp ?? '',
      video_url: payload.video_url ?? '',
      // Farm pricing — persisted only for farm listings; nulled otherwise.
      daily_price: payload.property_type === 'farm' ? (payload.daily_price ?? null) : null,
      weekly_price: payload.property_type === 'farm' ? (payload.weekly_price ?? null) : null,
      monthly_price: payload.property_type === 'farm' ? (payload.monthly_price ?? null) : null,
      min_booking_days:
        payload.property_type === 'farm' ? (payload.min_booking_days ?? null) : null,
      max_booking_days:
        payload.property_type === 'farm' ? (payload.max_booking_days ?? null) : null,
    })
    .eq('id', propertyId);

  if (error) throw new Error(error.message);
}
