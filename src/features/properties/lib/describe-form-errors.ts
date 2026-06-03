import type { Translations } from '@/lib/i18n/locales/ar';

/**
 * Turns a react-hook-form errors object into a short, localized list of the
 * field labels that failed validation — so a blocked "Publish" tells the user
 * exactly what to fix instead of just refusing silently.
 */
export function describeFormErrors(errors: unknown, t: Translations): string {
  if (!errors || typeof errors !== 'object') return '';

  const labels: Record<string, string> = {
    title: t.property.field.title,
    description: t.property.field.description,
    property_type: t.property.field.propertyType,
    listing_type: t.property.field.listingType,
    price: t.property.field.price,
    currency: t.property.field.currency,
    governorate_id: t.property.field.governorate,
    area_id: t.property.field.area,
    address: t.property.field.address,
    area_size: t.property.field.size,
    rooms: t.property.field.bedrooms,
    bathrooms: t.property.field.bathrooms,
    living_rooms: t.property.field.livingRooms,
    kitchens: t.property.field.kitchens,
    contact_phone: t.property.field.contactPhone,
    whatsapp: t.property.field.whatsapp,
    video_url: t.property.field.videoUrl,
    daily_price: t.property.farm.dailyPrice,
    weekly_price: t.property.farm.weeklyPrice,
    monthly_price: t.property.farm.monthlyPrice,
    min_booking_days: t.property.farm.minDays,
    max_booking_days: t.property.farm.maxDays,
    images: t.property.section.photos,
  };

  const names = Object.keys(errors as Record<string, unknown>).map((key) => labels[key] ?? key);
  return names.join('، ');
}
