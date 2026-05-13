export type PropertyCategory =
  | 'residential'
  | 'commercial'
  | 'land'
  | 'industrial'
  | 'agricultural';
export type PropertyListingType = 'sale' | 'rent';
export type PropertyStatus = 'draft' | 'pending' | 'active' | 'rejected';

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_cover: boolean;
}

export interface Property {
  id: string;
  office_id: string;
  title: string;
  slug: string;
  description: string;
  category: PropertyCategory;
  listing_type: PropertyListingType;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  area_size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  featured_image: string | null;
  status: PropertyStatus;
  rejection_reason: string | null;
  whatsapp: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyFilters {
  city?: string;
  district?: string;
  category?: PropertyCategory;
  listing_type?: PropertyListingType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  min_area?: number;
  max_area?: number;
  search?: string;
}
