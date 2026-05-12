import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseProperty {
  id: string;
  title: string;
  description: string;
  listing_type: 'rent' | 'sale';
  property_type: string;
  address: string;
  price: number;
  area_size: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  furnished: boolean;
  status: string;
  office_id: string;
  created_at: string;
  governorate_id: string | null;
  area_id: string | null;
  offices?: { office_name: string; phone: string } | null;
  property_images?: { image_url: string; is_cover: boolean }[];
}

export function useProperties(filters?: Record<string, string | null>) {
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('*, offices(office_name, phone), property_images(image_url, is_cover)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters?.listing_type)
      query = query.eq('listing_type', filters.listing_type as 'rent' | 'sale');
    if (filters?.property_type) query = query.eq('property_type', filters.property_type);
    if (filters?.rooms) query = query.gte('rooms', parseInt(filters.rooms));
    if (filters?.bathrooms) query = query.gte('bathrooms', parseInt(filters.bathrooms));
    if (filters?.furnished === 'yes') query = query.eq('furnished', true);
    if (filters?.furnished === 'no') query = query.eq('furnished', false);
    if (filters?.priceFrom) query = query.gte('price', parseFloat(filters.priceFrom));
    if (filters?.priceTo) query = query.lte('price', parseFloat(filters.priceTo));
    if (filters?.areaFrom) query = query.gte('area_size', parseFloat(filters.areaFrom));
    if (filters?.areaTo) query = query.lte('area_size', parseFloat(filters.areaTo));
    if (filters?.floor) query = query.eq('floor', parseInt(filters.floor));

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching properties:', error);
    }
    setProperties((data as SupabaseProperty[]) || []);
    setLoading(false);
  }, [
    filters?.listing_type,
    filters?.property_type,
    filters?.rooms,
    filters?.bathrooms,
    filters?.furnished,
    filters?.priceFrom,
    filters?.priceTo,
    filters?.areaFrom,
    filters?.areaTo,
    filters?.floor,
  ]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, refetch: fetchProperties };
}

export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<SupabaseProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*, offices(office_name, phone), property_images(image_url, is_cover)')
        .eq('id', id)
        .single();

      if (error) console.error('Error fetching property:', error);
      setProperty((data as SupabaseProperty) || null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  return { property, loading };
}

// Helper to get cover image or first image
export function getCoverImage(images?: { image_url: string; is_cover: boolean }[]): string {
  if (!images || images.length === 0) return '/placeholder.svg';
  const cover = images.find((i) => i.is_cover);
  return cover?.image_url || images[0].image_url;
}

export function getAllImages(images?: { image_url: string; is_cover: boolean }[]): string[] {
  if (!images || images.length === 0) return ['/placeholder.svg'];
  return images.map((i) => i.image_url);
}
