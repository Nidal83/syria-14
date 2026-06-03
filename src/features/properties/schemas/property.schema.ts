import { z } from 'zod';

// ─── Static option lists (no DB enum — property_type, direction, view, etc. are plain strings) ───

export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'land',
  'shop',
  'office',
  'building',
  'farm',
  'other',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_TYPES = ['rent', 'sale'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const CURRENCIES = ['SYP', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DIRECTIONS = [
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const VIEWS = ['street', 'garden', 'sea', 'mountain', 'city'] as const;
export type PropertyView = (typeof VIEWS)[number];

export const PAYMENT_METHODS = ['cash', 'installments', 'mixed'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const OWNERSHIP_TYPES = ['freehold', 'usufruct', 'waqf'] as const;
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

export const FEATURES_LIST = [
  'parking',
  'elevator',
  'balcony',
  'garden',
  'pool',
  'furnished',
  'ac',
  'heating',
  'security',
  'storage',
] as const;
export type PropertyFeature = (typeof FEATURES_LIST)[number];

// ─── Validation message interface ────────────────────────────────────────────

export interface ValidationMessages {
  required: string;
  tooShort: string;
  tooLong: string;
  notANumber: string;
  mustBePositive: string;
  invalidUrl: string;
  invalidPhone: string;
  atLeastOneImage: string;
  atLeastOnePrice: string;
  maxLessThanMin: string;
}

// ─── Helper: preprocess a form input value to number | undefined ─────────────

function toNumber(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

// ─── Farm-pricing cross-field refinement ─────────────────────────────────────
// Farm listings (property_type === 'farm') must set at least one price tier,
// and max_booking_days must not be below min_booking_days. The refinement is a
// no-op for every other property type, so non-farm listings are unaffected.

interface FarmRefineShape {
  property_type?: string;
  daily_price?: number;
  weekly_price?: number;
  monthly_price?: number;
  min_booking_days?: number;
  max_booking_days?: number;
}

function farmRefine(v: ValidationMessages) {
  return (data: FarmRefineShape, ctx: z.RefinementCtx) => {
    if (data.property_type !== 'farm') return;

    if (data.daily_price == null && data.weekly_price == null && data.monthly_price == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v.atLeastOnePrice,
        path: ['daily_price'],
      });
    }

    if (
      data.min_booking_days != null &&
      data.max_booking_days != null &&
      data.max_booking_days < data.min_booking_days
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: v.maxLessThanMin,
        path: ['max_booking_days'],
      });
    }
  };
}

// ─── Schema factory ───────────────────────────────────────────────────────────

function propertyObject(v: ValidationMessages) {
  return z.object({
    // ── Basic info ──────────────────────────────────────────────────────────
    title: z.string().min(5, v.tooShort).max(150, v.tooLong),
    description: z.string().min(30, v.tooShort).max(4000, v.tooLong),
    property_type: z.enum(PROPERTY_TYPES, { required_error: v.required }),
    listing_type: z.enum(LISTING_TYPES, { required_error: v.required }),
    price: z.preprocess(
      toNumber,
      z
        .number({ invalid_type_error: v.notANumber, required_error: v.required })
        .positive(v.mustBePositive),
    ),
    currency: z.enum(CURRENCIES).default('USD'),

    // ── Location ────────────────────────────────────────────────────────────
    governorate_id: z.string({ required_error: v.required }).min(1, v.required),
    area_id: z.string({ required_error: v.required }).min(1, v.required),
    address: z.string().min(5, v.tooShort).max(250, v.tooLong),

    // ── Details ─────────────────────────────────────────────────────────────
    // DB column is area_size; spec calls it size
    area_size: z.preprocess(
      toNumber,
      z
        .number({ invalid_type_error: v.notANumber, required_error: v.required })
        .positive(v.mustBePositive),
    ),
    // DB column is rooms; spec calls it bedrooms
    rooms: z.preprocess(
      toNumber,
      z
        .number({ invalid_type_error: v.notANumber, required_error: v.required })
        .int()
        .min(0, v.mustBePositive),
    ),
    bathrooms: z.preprocess(
      toNumber,
      z
        .number({ invalid_type_error: v.notANumber, required_error: v.required })
        .int()
        .min(0, v.mustBePositive),
    ),
    living_rooms: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().min(0).default(0),
    ),
    kitchens: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().min(0).default(1),
    ),
    floor: z.preprocess(toNumber, z.number({ invalid_type_error: v.notANumber }).int().optional()),
    total_floors: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().positive().optional(),
    ),
    building_age: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().min(0).optional(),
    ),
    direction: z.string().optional(),
    view: z.string().optional(),

    // ── Farm pricing (only meaningful when property_type === 'farm') ─────────
    daily_price: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).positive(v.mustBePositive).optional(),
    ),
    weekly_price: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).positive(v.mustBePositive).optional(),
    ),
    monthly_price: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).positive(v.mustBePositive).optional(),
    ),
    min_booking_days: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().min(1, v.mustBePositive).optional(),
    ),
    max_booking_days: z.preprocess(
      toNumber,
      z.number({ invalid_type_error: v.notANumber }).int().min(1, v.mustBePositive).optional(),
    ),

    // ── Features ────────────────────────────────────────────────────────────
    features: z.array(z.string()).default([]),
    payment_method: z.string().optional(),
    ownership_type: z.string().optional(),

    // ── Contact ─────────────────────────────────────────────────────────────
    contact_phone: z
      .string({ required_error: v.required })
      .min(1, v.required)
      .regex(/^[\d+\s()،-]{7,20}$/, v.invalidPhone),
    whatsapp: z
      .string()
      .optional()
      .refine((val) => !val || /^[\d+\s()،-]{7,20}$/.test(val), v.invalidPhone),
    video_url: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }, v.invalidUrl),

    // ── Photos ──────────────────────────────────────────────────────────────
    images: z
      .array(z.custom<File>((val) => val instanceof File))
      .min(1, v.atLeastOneImage)
      .max(15),
  });
}

export function createPropertySchema(v: ValidationMessages) {
  return propertyObject(v).superRefine(farmRefine(v));
}

export type CreatePropertyValues = z.infer<ReturnType<typeof createPropertySchema>>;

export function editPropertySchema(v: ValidationMessages) {
  return propertyObject(v)
    .omit({ images: true })
    .extend({
      images: z
        .array(z.custom<File>((val) => val instanceof File))
        .max(15)
        .default([]),
    })
    .superRefine(farmRefine(v));
}

export type EditPropertyValues = z.infer<ReturnType<typeof editPropertySchema>>;
