# Main Navigation Pages — Diagnostic Report

Generated: 2026-05-19

---

## 1. Navigation Links Found

The main nav is built in `src/components/layout/Header.tsx`. It constructs a `navLinks` array and renders identical links for both desktop and mobile.

### Main nav links (desktop + mobile — identical)

| Label (AR) | Label (EN) | Path          | i18n key           |
| ---------- | ---------- | ------------- | ------------------ |
| الرئيسية   | Home       | `/`           | `t.nav.home`       |
| العقارات   | Properties | `/properties` | `t.nav.properties` |
| المكاتب    | Offices    | `/offices`    | `t.nav.offices`    |
| البحث      | Search     | `/search`     | `t.nav.search`     |
| التواصل    | Contact    | `/contact`    | `t.nav.contact`    |

### Authenticated user dropdown (desktop only)

| Label (AR)   | Label (EN)             | Path                                                                     | Condition                       |
| ------------ | ---------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| لوحة التحكم  | Dashboard              | role-based (`/office/dashboard`, `/control-panel/dashboard`, `/account`) | authenticated                   |
| حسابي        | My Account             | `/account`                                                               | authenticated                   |
| —            | Favorites (heart icon) | `/favorites`                                                             | authenticated, hidden on mobile |
| تسجيل الخروج | Logout                 | (onClick)                                                                | authenticated                   |

### Unauthenticated buttons (desktop + mobile)

| Label (EN) | Path        |
| ---------- | ----------- |
| Login      | `/login`    |
| Register   | `/register` |

### Mobile nav difference

The mobile nav renders the same five `navLinks` plus Login/Register buttons. No additional links appear in mobile that are absent on desktop.

---

## 2. Route → Component Map

| Path                | Component file                            | Lazy? | Classification |
| ------------------- | ----------------------------------------- | ----- | -------------- |
| `/`                 | `src/pages/public/HomePage.tsx`           | Yes   | PARTIAL        |
| `/properties`       | `src/pages/public/PropertiesPage.tsx`     | Yes   | STUB           |
| `/properties/:slug` | `src/pages/public/PropertyDetailPage.tsx` | Yes   | COMPLETE       |
| `/search`           | `src/pages/public/SearchPage.tsx`         | Yes   | COMPLETE       |
| `/offices`          | `src/pages/public/OfficesPage.tsx`        | Yes   | STUB           |
| `/offices/:slug`    | `src/pages/public/OfficeDetailPage.tsx`   | Yes   | STUB           |
| `/contact`          | `src/pages/public/ContactPage.tsx`        | Yes   | STUB           |

All public pages are loaded via `React.lazy()` in `src/routes/index.tsx` and wrapped in a shared `<Suspense>` boundary.

---

## 3. Per-Page Audit

### 3.1 `/` — HomePage

**File:** `src/pages/public/HomePage.tsx` — 143 lines
**Classification: PARTIAL**

#### Supabase calls

| Table          | Operation                                               | Columns selected                                                                                                                            |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `properties`   | SELECT (in `fetchLatestProperties`)                     | `id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, created_at` |
| `governorates` | SELECT (inside `SearchBox`)                             | `id, name_ar, name_en`                                                                                                                      |
| `areas`        | SELECT (inside `SearchBox`, conditional on governorate) | `id, name_ar, name_en`                                                                                                                      |

#### useEffect hooks

None directly in `HomePage`. The `fetchLatestProperties` function is a plain `async` function passed as `queryFn` to `PropertySection`, which executes it via React Query.

#### JSX return

```tsx
return (
  <div className="flex flex-col">
    {/* ── Hero ── */}
    <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden">
      {/* background image + overlays */}
      <div className="relative z-10 w-full px-4 pb-16 pt-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 ...>{t.search.heroTitle}</h1>
          <p ...>{t.search.heroSubtitle}</p>
        </div>
        <div className="mx-auto max-w-4xl">
          <SearchBox />
        </div>
      </div>
    </section>

    {/* ── Featured Properties ── */}
    <section className="container py-12">
      {/* heading + "View all" link → /search */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {featuredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>

    {/* ── Latest Properties ── */}
    <PropertySection
      title={t.pages.latestProperties}
      queryKey="latest-properties"
      queryFn={fetchLatestProperties}
      viewAllHref={PATHS.properties}
    />
  </div>
);
```

#### Gap

The "Featured Properties" section (3 cards) is populated from `sampleProperties` — a hardcoded static array in `src/data/properties.ts`. A `TODO(Phase 3)` comment in the source documents the intent to replace it with real DB data. The "Latest Properties" section at the bottom IS wired to Supabase.

---

### 3.2 `/properties` — PropertiesPage

**File:** `src/pages/public/PropertiesPage.tsx` — 11 lines
**Classification: STUB**

#### Supabase calls

None.

#### useEffect hooks

None.

#### JSX return

```tsx
return (
  <div className="container py-8">
    <h1 className="text-2xl font-bold">{t.pages.properties}</h1>
    <p className="mt-2 text-muted-foreground">{t.property.noProperties}</p>
  </div>
);
```

#### Gap

This page renders a heading and a static "No properties found" paragraph — no filtering, no grid, no Supabase call. `useProperties` hook exists in `src/hooks/useProperties.ts` and is functionally capable of powering this page, but it is not imported here.

---

### 3.3 `/properties/:slug` — PropertyDetailPage

**File:** `src/pages/public/PropertyDetailPage.tsx` — 640 lines
**Classification: COMPLETE**

#### Supabase calls

| Table                  | Operation                                                                           | Key columns / joins                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `properties`           | SELECT via React Query                                                              | all property fields + `offices(...)`, `property_images(...)`, `governorates(name_ar,name_en)`, `areas(name_ar,name_en)` |
| `properties` (related) | SELECT via React Query                                                              | same shape, filtered by category, limited 4                                                                             |
| `inquiries`            | INSERT (contact form submit)                                                        | `property_id, name, phone, message`                                                                                     |
| `favorites`            | SELECT + INSERT/DELETE (via `useFavoritePropertyIds` / `useToggleFavoriteProperty`) | `property_id, user_id`                                                                                                  |

#### useEffect hooks

None directly — all data via React Query hooks (`useQuery`).

#### JSX return (abbreviated — full file is 640 lines)

```tsx
return (
  <div className="container py-6">
    {/* breadcrumb nav */}
    {/* image gallery: main + prev/next buttons + dot indicators + thumbnail strip */}
    {/* grid: left col (title, specs, features, description, contact form)
             right col (price card, office card, share/favorite buttons) */}
    {/* related properties via PropertySection */}
  </div>
);
```

This page is complete and production-worthy.

---

### 3.4 `/search` — SearchPage

**File:** `src/pages/public/SearchPage.tsx` — 203 lines
**Classification: COMPLETE**

#### Supabase calls

| Table          | Operation                                                                    | Filters applied                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `properties`   | SELECT (via `useSearchResults`)                                              | `status='active'` + up to 12 URL param filters (listing_type, category, governorate_id, area_id, furnished, floor, rooms, bathrooms, min/max price, min/max area) |
| `governorates` | SELECT (inside `SearchBox`)                                                  | ordered by `name_ar`                                                                                                                                              |
| `areas`        | SELECT (inside `SearchBox`)                                                  | filtered by `governorate_id`                                                                                                                                      |
| `favorites`    | SELECT + mutate (via `useFavoritePropertyIds` / `useToggleFavoriteProperty`) | `user_id`                                                                                                                                                         |

#### useEffect hooks

None directly — all data via React Query.

#### JSX return

```tsx
return (
  <div className="container space-y-6 py-6">
    <SearchBox compact className="shadow-card" />

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h1 ...>{hasFilters ? t.search.results : t.pages.latestProperties}</h1>
        {!isLoading && !isError && (
          <p ...>{properties.length} {t.property.properties}</p>
        )}
      </div>
      <FilterSummary params={searchParams} />
    </div>

    {isLoading && <SkeletonGrid />}
    {isError && <p ...>{t.errors.generic}</p>}
    {!isLoading && !isError && properties.length === 0 && (
      <p ...>{t.search.noResults}</p>
    )}
    {!isLoading && !isError && properties.length > 0 && (
      <div className="grid ...">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} ... />
        ))}
      </div>
    )}
  </div>
);
```

---

### 3.5 `/offices` — OfficesPage

**File:** `src/pages/public/OfficesPage.tsx` — 10 lines
**Classification: STUB**

#### Supabase calls

None.

#### useEffect hooks

None.

#### JSX return

```tsx
return (
  <div className="container py-8">
    <h1 className="text-2xl font-bold">{t.pages.offices}</h1>
  </div>
);
```

#### Gap

Heading only. The `offices` table exists in the DB, `OfficeCard` component exists at `src/components/OfficeCard.tsx`, and `useFavoriteOfficeIds` / `useToggleFavoriteOffice` hooks exist — none are imported here.

---

### 3.6 `/offices/:slug` — OfficeDetailPage

**File:** `src/pages/public/OfficeDetailPage.tsx` — 13 lines
**Classification: STUB**

#### Supabase calls

None.

#### useEffect hooks

None.

#### JSX return

```tsx
return (
  <div className="container py-8">
    <h1 className="text-2xl font-bold">{t.pages.officeDetail}</h1>
    <p className="mt-2 text-muted-foreground">Slug: {slug}</p>
  </div>
);
```

#### Gap

Renders the slug string as debug output. No office data fetched, no listing of properties by that office, no contact information.

---

### 3.7 `/contact` — ContactPage

**File:** `src/pages/public/ContactPage.tsx` — 10 lines
**Classification: STUB**

#### Supabase calls

None.

#### useEffect hooks

None.

#### JSX return

```tsx
return (
  <div className="container py-8">
    <h1 className="text-2xl font-bold">{t.pages.contact}</h1>
  </div>
);
```

#### Gap

Heading only. No contact form, no address/phone display, no map embed, no Supabase write target (no `contact_messages` table exists yet — only `inquiries`).

---

## 4. Shared Components Inventory

| Component             | File                                     | Used in nav pages                                                    |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `SearchBox`           | `src/components/SearchBox.tsx`           | HomePage (`/`), SearchPage (`/search`)                               |
| `PropertyCard`        | `src/components/PropertyCard.tsx`        | HomePage, SearchPage, PropertyDetailPage (related)                   |
| `PropertySection`     | `src/components/PropertySection.tsx`     | HomePage (latest properties section)                                 |
| `OfficeCard`          | `src/components/OfficeCard.tsx`          | **Not imported by any nav page** (OfficesPage is a stub)             |
| `ImageGallery`        | `src/components/ImageGallery.tsx`        | PropertyDetailPage (640-line file, not yet confirmed used vs inline) |
| `NavLink`             | `src/components/NavLink.tsx`             | Utility — not a page-level component                                 |
| `ErrorBoundary`       | `src/components/ErrorBoundary.tsx`       | App shell only                                                       |
| `PropertyImageUpload` | `src/components/PropertyImageUpload.tsx` | Not used in any nav page (office-side upload)                        |

**Component already available but disconnected:**

- `OfficeCard` is fully built (displays logo, name, description, phone, favorite toggle) and expects an `offices` DB row, but `OfficesPage` doesn't import or use it.

---

## 5. Data Layer Availability

| Table                 | Exists in DB?              | Referenced in                                                                                                                 | Custom hook / service                                                                                     |
| --------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `properties`          | ✅ (types.ts + migrations) | `HomePage`, `SearchPage`, `PropertyDetailPage`, `features/properties/api/properties.service.ts`, `src/hooks/useProperties.ts` | `useProperties`, `useSearchResults` (inline), `useProperty`                                               |
| `property_images`     | ✅                         | `features/properties/api/property-images.service.ts`, `PropertyDetailPage`                                                    | `uploadPropertyImage`, `insertPropertyImage`, `deletePropertyImage`                                       |
| `governorates`        | ✅                         | `SearchBox`, `features/properties/api/properties.service.ts`                                                                  | `useGovernorates` (inline in SearchBox), `fetchGovernorates`                                              |
| `areas`               | ✅                         | `SearchBox`, `features/properties/api/properties.service.ts`                                                                  | `useAreas` (inline in SearchBox), `fetchAreasByGovernorate`                                               |
| `offices`             | ✅                         | `features/offices/api/office.service.ts`, `PropertyDetailPage`                                                                | `getCurrentOffice`, `updateCurrentOffice`, `getOfficeStats` — none public-facing                          |
| `inquiries`           | ✅ (types.ts)              | `PropertyDetailPage` (INSERT on contact form)                                                                                 | None — direct Supabase call inline                                                                        |
| `favorites`           | ✅                         | `src/lib/hooks/useFavorites.ts`, `SearchPage`, `PropertyDetailPage`                                                           | `useFavoritePropertyIds`, `useToggleFavoriteProperty`, `useFavoriteProperties`                            |
| `favorite_offices`    | ✅ (types.ts)              | `src/lib/hooks/useFavorites.ts`                                                                                               | `useFavoriteOfficeIds`, `useToggleFavoriteOffice`, `useFavoriteOffices` — **not consumed by OfficesPage** |
| `office_applications` | ✅ (types.ts)              | `RegisterPage`, `admin/ApplicationsPage`                                                                                      | None — direct Supabase calls                                                                              |
| `property_types`      | ❌ not yet                 | Planned Phase 3                                                                                                               | None planned yet                                                                                          |
| `contact_messages`    | ❌ not yet                 | Not referenced anywhere                                                                                                       | None — Phase 3 roadmap item                                                                               |

---

## 6. Summary & Gaps

### `/` — Home Page (PARTIAL)

The home page is mostly functional. The hero section and search box (Supabase-backed geography dropdowns) work. The "Latest Properties" section at the bottom fetches real data from the `properties` table. The **gap** is the "Featured Properties" section (3 cards), which is currently populated from a static `sampleProperties` array in `src/data/properties.ts` rather than the DB. There is a documented `TODO(Phase 3)` comment in the source for this. SEO meta tags can be added now; the page has substantial rendered content.

### `/properties` — Properties Page (STUB)

This page is an 11-line stub — a heading and a static "no properties" paragraph. It does nothing. The infrastructure to power it exists (`useProperties` hook, `PropertyCard`, `SearchBox`), but none of it is wired in. **Nothing meaningful can be crawled here.** SEO meta tags would be wasteful until the page renders real listings with pagination and filter controls.

### `/search` — Search Page (COMPLETE)

Fully implemented. Queries `properties` with 12+ URL-param filters, shows skeleton loading, error, and empty states, and integrates with the favorites system. The `SearchBox` hydrates geography dropdowns from the DB. SEO meta tags are worth adding now; dynamic `<title>` and description should reflect the active filter state.

### `/offices` — Offices Page (STUB)

10-line stub — heading only. The `offices` table is populated, `OfficeCard` is built and ready, and the `useFavoriteOfficeIds` hook exists — none are used here. **No crawlable content.** SEO meta tags are premature until the page renders a real grid of offices.

### `/offices/:slug` — Office Detail Page (STUB)

13-line stub that echoes the slug to the DOM. No office data is fetched, no property listings for that office, no contact information. **Entirely empty.** Additionally, the `offices` table has a `slug` column that can be null, so a slug-based lookup strategy needs to be confirmed before building this out.

### `/contact` — Contact Page (STUB)

10-line stub. No form, no address, no map, no DB write target (`contact_messages` table does not exist). The `inquiries` table is the closest analog but is currently property-specific. **Not suitable for SEO or real traffic** until the page is built.

---

### Prioritized build order (before SEO meta tags are meaningful)

1. **`/offices`** (HIGH) — `OfficeCard` and `favorite_offices` hooks already exist; this is mostly a matter of wiring a React Query call to the `offices` table and rendering the grid. Unblocked.

2. **`/properties`** (HIGH) — `PropertyCard`, `SearchBox`, and filter logic already live in `SearchPage`. `PropertiesPage` should reuse them with a simpler "browse all active" query and pagination. Unblocked.

3. **`/`** Featured section (MEDIUM) — Replace `sampleProperties.slice(0,3)` with a `useQuery` call fetching e.g. the 3 most recently published or most-viewed active properties. Straightforward; unblocks meaningful home-page SEO.

4. **`/offices/:slug`** (MEDIUM) — Requires a public `getOfficeBySlug(slug)` service function, then rendering office info + the office's active property listings. Also requires confirming that `offices.slug` is non-null for all approved offices.

5. **`/contact`** (LOW) — Requires a `contact_messages` table migration, a simple form component, and a `INSERT` call. Low complexity but currently completely absent.
