# New Property Form — implementation plan

Captured: 2026-05-17

## Phase A findings

### A1. Database schema

**`properties` table** (source: `src/integrations/supabase/types.ts`):

| Column                        | TS type        | Nullable / default        | Notes                       |
| ----------------------------- | -------------- | ------------------------- | --------------------------- |
| id                            | string         | auto                      |                             |
| title                         | string         | **required**              |                             |
| description                   | string         | default ''                |                             |
| property_type                 | string         | default ''                | plain string, NOT an enum   |
| listing_type                  | "rent"\|"sale" | default (optional insert) | DB enum `listing_type`      |
| price                         | number         | default 0                 |                             |
| currency                      | string         | default 'USD'             | plain string                |
| area_size                     | number         | default 0                 | spec calls this `size`      |
| rooms                         | number         | default 0                 | spec calls this `bedrooms`  |
| bathrooms                     | number         | default 0                 |                             |
| living_rooms                  | number         | default 0                 |                             |
| kitchens                      | number         | default 0                 |                             |
| floor                         | number         | default 0                 |                             |
| total_floors                  | number         | default 0                 |                             |
| building_age                  | number         | default 0                 |                             |
| direction                     | string         | default ''                | plain string                |
| view                          | string         | default ''                | plain string                |
| furnished                     | boolean        | default false             | derived from features array |
| features                      | string[]       | default []                |                             |
| payment_method                | string         | default ''                | plain string                |
| ownership_type                | string         | default ''                | plain string                |
| contact_phone                 | string         | default ''                |                             |
| whatsapp                      | string         | default ''                |                             |
| video_url                     | string         | default ''                |                             |
| address                       | string         | default ''                |                             |
| governorate_id                | string \| null | nullable                  | FK → governorates           |
| area_id                       | string \| null | nullable                  | FK → areas                  |
| city                          | string         | default ''                | redundant; populated as ''  |
| office_id                     | string         | **required**              | FK → offices                |
| status                        | string         | default 'pending'         | set explicitly on insert    |
| featured_image                | string \| null | nullable                  | set after image upload      |
| slug                          | string \| null | nullable                  | auto/null                   |
| category                      | string         | default 'residential'     | not in form                 |
| amenities                     | Json           | default '[]'              | not in form                 |
| district                      | string \| null | nullable                  | not in form                 |
| latitude / longitude          | number \| null | nullable                  | not in form                 |
| meta_title / meta_description | string \| null | nullable                  | not in form                 |
| rejection_reason              | string \| null | nullable                  | not in form                 |

**`property_images` table**:

| Column      | TS type | Notes                                       |
| ----------- | ------- | ------------------------------------------- |
| id          | string  | auto                                        |
| property_id | string  | FK → properties                             |
| image_url   | string  | **not `url`** — spec uses wrong name        |
| is_cover    | boolean | **not `is_primary`** — spec uses wrong name |

⚠️ **No `display_order` column exists.** The spec requests it; the schema does not have it.
Images will be inserted in the desired order; cover is determined by `is_cover = true`.

**Storage bucket `property-images`**: Bucket is referenced by the existing
`PropertyImageUpload.tsx` component (`storage.from('property-images')`),
which means it was created during initial project setup. The v2 clean schema
migration documents it as a manual step outside SQL migrations.

### A2. Existing form patterns

`OfficeApplicationForm.tsx` uses **`useState` + manual `e.preventDefault()`** — not react-hook-form.

However, the project also has:

- `src/components/ui/form.tsx` — full shadcn react-hook-form wrapper (FormField, FormItem, FormControl, FormLabel, FormMessage, FormDescription)
- `react-hook-form ^7.61.1` in dependencies
- `@hookform/resolvers ^3.10.0` in dependencies
- `zod ^3.25.76` in dependencies

The SPEC explicitly requests zod schemas + react-hook-form. This is the correct choice.
Style cues adopted from `OfficeApplicationForm`:

- Required asterisk: `<span className="text-destructive">*</span>` after label
- Optional label: `<span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>`
- Loading / submitting text pattern from `t.common.loading`
- `toast.error()` / `toast.success()` from sonner

### A3. Available shadcn primitives

All needed primitives exist in `src/components/ui/`:
`button`, `card`, `checkbox`, `form`, `input`, `label`, `radio-group`,
`select`, `separator`, `textarea`, `badge`, `skeleton`.

No new shadcn components are needed.

### A4. i18n shape

Keys are nested plain objects accessed as `t.namespace.key`.
`Translations` type is derived from `typeof ar` via `StringValues<>` widening.
Adding keys to `ar.ts` automatically makes them required in `en.ts`.

New top-level namespace added: `validation`.
New sub-objects added inside `property`:
`form`, `section`, `field`, `types`, `feature`, `photos`, `actions`,
`success`, `error`, `warning`, `directions`, `views`, `paymentMethods`, `ownershipTypes`.

Existing keys reused directly (no new key added where equivalent exists):
`t.property.sale`, `t.property.rent`, `t.property.bedrooms`, `t.property.bathrooms`,
`t.property.floor`, `t.property.totalFloors`, `t.property.buildingAge`, `t.property.kitchens`,
`t.property.livingRooms`, `t.property.direction`, `t.property.view`, `t.property.ownershipType`,
`t.property.paymentMethod`, `t.property.whatsapp`, `t.property.features`, `t.property.address`,
`t.property.propertyType`, `t.common.cancel`, `t.common.optional`.

### A5. Image upload utility

`PropertyImageUpload.tsx` exists but uploads **immediately on file select** before form
submission, which is incompatible with the spec's deferred-upload requirement.
A new `property-images.service.ts` is written that:

1. Compresses images > 1 MB via canvas (no new dependency)
2. Uploads to `property-images` bucket at path `{office_id}/{property_id}/{uuid}.{ext}`
3. Inserts a row into `property_images` with `image_url` and `is_cover`

---

## Schema → form field mapping

### `properties` insert payload

| Form field                       | DB column                | Notes                                    |
| -------------------------------- | ------------------------ | ---------------------------------------- |
| `title`                          | `title`                  | required                                 |
| `description`                    | `description`            | required                                 |
| `property_type`                  | `property_type`          | enum from static list                    |
| `listing_type`                   | `listing_type`           | DB enum 'rent'\|'sale'                   |
| `price`                          | `price`                  | positive number                          |
| `currency`                       | `currency`               | 'SYP'\|'USD'\|'EUR'                      |
| `governorate_id`                 | `governorate_id`         | UUID from governorates table             |
| `area_id`                        | `area_id`                | UUID from areas table                    |
| `address`                        | `address`                | required                                 |
| `size` (form)                    | `area_size`              | renamed                                  |
| `bedrooms` (form)                | `rooms`                  | renamed                                  |
| `bathrooms`                      | `bathrooms`              | direct                                   |
| `living_rooms`                   | `living_rooms`           | direct                                   |
| `kitchens`                       | `kitchens`               | direct                                   |
| `floor`                          | `floor`                  | optional integer                         |
| `total_floors`                   | `total_floors`           | optional positive integer                |
| `building_age`                   | `building_age`           | optional non-negative integer            |
| `direction`                      | `direction`              | optional string from static list         |
| `view`                           | `view`                   | optional string from static list         |
| `features`                       | `features`               | string[]                                 |
| `features.includes('furnished')` | `furnished`              | derived boolean                          |
| `payment_method`                 | `payment_method`         | optional string                          |
| `ownership_type`                 | `ownership_type`         | optional string                          |
| `contact_phone`                  | `contact_phone`          | required                                 |
| `whatsapp`                       | `whatsapp`               | optional                                 |
| `video_url`                      | `video_url`              | optional URL                             |
| `images` (File[])                | → `property_images` rows | uploaded separately                      |
| —                                | `office_id`              | from getMyOffice(profile.id)             |
| —                                | `status`                 | hardcoded 'pending'                      |
| —                                | `city`                   | hardcoded '' (empty; column has default) |
| —                                | `featured_image`         | set to first uploaded image URL          |

### `property_images` insert payload

| Spec name       | DB column     | Notes                                      |
| --------------- | ------------- | ------------------------------------------ |
| `url`           | `image_url`   | **spec wrong** — use `image_url`           |
| `is_primary`    | `is_cover`    | **spec wrong** — use `is_cover`            |
| `display_order` | _(not in DB)_ | **dropped** — insertion order used instead |
| `property_id`   | `property_id` | from newly created property                |

### Spec fields with no DB column → disposition

| Spec field                | Disposition                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `currency`                | Kept — `properties.currency` exists (string, default 'USD') |
| `direction`               | Kept — `properties.direction` exists (string)               |
| `view`                    | Kept — `properties.view` exists (string)                    |
| `payment_method`          | Kept — `properties.payment_method` exists (string)          |
| `ownership_type`          | Kept — `properties.ownership_type` exists (string)          |
| `display_order` on images | **Dropped** — no DB column; insertion order preserved       |
| `is_primary`              | **Renamed** to `is_cover` (actual DB column name)           |
| `url` on images           | **Renamed** to `image_url` (actual DB column name)          |

---

## Files to create or modify

### New files

```
src/features/properties/schemas/property.schema.ts
src/features/properties/api/properties.service.ts
src/features/properties/api/property-images.service.ts
src/features/properties/components/FormShell.tsx
src/features/properties/components/NewPropertyForm.tsx
src/features/properties/components/sections/BasicInfoSection.tsx
src/features/properties/components/sections/LocationSection.tsx
src/features/properties/components/sections/DetailsSection.tsx
src/features/properties/components/sections/FeaturesSection.tsx
src/features/properties/components/sections/ContactSection.tsx
src/features/properties/components/sections/PhotosSection.tsx
src/features/properties/hooks/use-create-property.ts
docs/diagnostics/new-property-plan.md   ← this file
```

### Modified files

```
src/lib/i18n/locales/ar.ts             (new keys added)
src/lib/i18n/locales/en.ts             (new keys added)
src/pages/office/NewPropertyPage.tsx   (stub replaced)
docs/ROADMAP.md                        (append entry)
```

---

## Image upload path pattern

```
property-images/{office_id}/{property_id}/{uuid}.{ext}
```

- `office_id`: the office's UUID (from `offices` table, queried by `owner_id = profile.id`)
- `property_id`: the newly inserted property's UUID
- `uuid`: `crypto.randomUUID()` — avoids filename collisions
- `ext`: original file extension (jpg, png, webp)

---

## Static option lists (no DB enum)

### property_type

`apartment | villa | land | shop | office | building | other`

### direction

`north | south | east | west | northeast | northwest | southeast | southwest`

### view

`street | garden | sea | mountain | city`

### payment_method

`cash | installments | mixed`

### ownership_type

`freehold | usufruct | waqf`

### currency

`SYP | USD | EUR`

### features (checkboxes)

`parking | elevator | balcony | garden | pool | furnished | ac | heating | security | storage`
