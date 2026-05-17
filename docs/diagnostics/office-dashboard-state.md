# Office Dashboard — current state (diagnostic)

Captured: 2026-05-17

## Files relevant to /office

- `src/routes/index.tsx` — 169 lines — router definition (office routes lines 123–139)
- `src/routes/paths.ts` — 49 lines — PATHS constants
- `src/routes/guards/AuthGuard.tsx`
- `src/routes/guards/RoleGuard.tsx`
- `src/routes/guards/GuestGuard.tsx`
- `src/components/layout/DashboardLayout.tsx` — 164 lines — shared sidebar + topbar + `<Outlet />`
- `src/pages/office/DashboardPage.tsx` — 62 lines — /office/dashboard (working)
- `src/pages/office/PropertiesPage.tsx` — 23 lines — /office/properties (working)
- `src/pages/office/ProfilePage.tsx` — **10 lines** — /office/profile (stub)
- `src/pages/office/SettingsPage.tsx` — **10 lines** — /office/settings (stub)
- `src/pages/office/NewPropertyPage.tsx` — **11 lines** — /office/properties/new (stub)
- `src/pages/office/EditPropertyPage.tsx` — 13 lines — /office/properties/:id/edit (stub)
- `src/providers/AuthProvider.tsx` — 368 lines — auth context
- `src/data/properties.ts` — 391 lines — sample data (governorates, areas, propertyTypes)
- `src/features/office/components/OfficeApplicationForm.tsx` — office application form (unrelated)

## Routing under /office

```tsx
// ── Office dashboard routes ───────────────────────────────────────────
{
  element: (
    <AuthGuard>
      <RoleGuard roles={['office', 'admin']}>
        <DashboardLayout role="office" />
      </RoleGuard>
    </AuthGuard>
  ),
  children: [
    { path: PATHS.officeDashboard, element: <OfficeDashboardPage /> },
    { path: PATHS.officeProperties, element: <OfficePropertiesPage /> },
    { path: PATHS.officeNewProperty, element: <NewPropertyPage /> },
    { path: '/office/properties/:id/edit', element: <EditPropertyPage /> },
    { path: PATHS.officeProfile, element: <OfficeProfilePage /> },
    { path: PATHS.officeSettings, element: <OfficeSettingsPage /> },
  ],
},
```

## Office-related route constants

```ts
// Pending office
officeApply: '/office/apply',
officeApplicationStatus: '/office/application-status',

// Office dashboard
officeDashboard: '/office/dashboard',
officeProperties: '/office/properties',
officeNewProperty: '/office/properties/new',
officeEditProperty: (id: string) => `/office/properties/${id}/edit`,
officeProfile: '/office/profile',
officeMessages: '/office/messages',
officeSettings: '/office/settings',
```

## /office/profile (Office Name tab)

- Component rendered: `OfficeProfilePage` — `src/pages/office/ProfilePage.tsx`
- Return statement:

```tsx
return (
  <div className="space-y-4">
    <h1 className="text-xl font-bold">{t.office.officeName}</h1>
  </div>
);
```

- Status: **stub — heading only, no body content**
- Notes: The component is 10 lines total. It imports `useI18n` and renders a single `<h1>`. No form, no data fetching, no profile fields. This is an unimplemented placeholder — the body beneath the heading is intentionally absent from the code.

## /office/settings (My Account tab)

- Component rendered: `OfficeSettingsPage` — `src/pages/office/SettingsPage.tsx`
- Return statement:

```tsx
return (
  <div className="space-y-4">
    <h1 className="text-xl font-bold">{t.nav.account}</h1>
  </div>
);
```

- Status: **stub — heading only, no body content**
- Notes: Identical pattern to ProfilePage — 10 lines, single `<h1>`, no form, no password-change UI, no settings fields. Another unimplemented placeholder.

## Add Property

- Triggered by: `<Button asChild size="sm"><Link to={PATHS.officeNewProperty}>` in `src/pages/office/PropertiesPage.tsx` (line 13–18). This is a plain navigation link, not a dialog trigger. Clicking it navigates to `/office/properties/new`.
- Component / dialog opened: `NewPropertyPage` — `src/pages/office/NewPropertyPage.tsx`
- Return statement (full component):

```tsx
import { useI18n } from '@/lib/i18n/context';

export default function NewPropertyPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.property.addProperty}</h1>
      <p className="text-muted-foreground">{t.common.loading}</p>
    </div>
  );
}
```

- Loading state owner: **there is no loading state**. There is no `useState`, no `useEffect`, no async call, no spinner component. The word "Loading" (or its Arabic equivalent) is rendered as a **static paragraph** using the `t.common.loading` i18n key — it is not a loading indicator that will ever resolve.
- **FLAG:** The page renders `{t.common.loading}` as literal, permanent text. It is a stub that was scaffolded with the loading string as a placeholder for future content. The user sees "Loading..." indefinitely because that string is hard-coded into the JSX, not because any async operation is pending.
- Likely cause of hang: The `NewPropertyPage` is a stub. It was never implemented — no form, no data-fetching, no state machine. The i18n loading string was left in as a visual placeholder during scaffolding and never replaced with actual form content.

## Sample data

- `data/properties.ts` present: **yes**
- `governorates` / `areas` / `propertyTypes`:
  - Found at: `src/data/properties.ts` — lines 26, 43, and 195 respectively
  - All three are exported: `export const governorates`, `export const areas`, `export const propertyTypes`
  - Used by Add Property form: N/A — `NewPropertyPage.tsx` imports nothing from `data/properties.ts`. The form has not been implemented yet, so there is no import line to check. The data is available and intact; the consumer simply doesn't exist yet.

## TODO / placeholder hits in office-related files

No `TODO`, `FIXME`, `placeholder`, or `coming soon` strings were found in `src/pages/office/` or `src/pages/pending-office/`. The stubs were shipped without comment annotations.

One hit in `src/features/office/components/OfficeApplicationForm.tsx`:

- `OfficeApplicationForm.tsx:291` — `placeholder={t.search.anyCity}` (this is a valid i18n `placeholder` attribute on a `<SelectValue>`, not a TODO comment — not relevant to the broken tabs)

## AuthContext office fields

- `User.officeName` / `User.officeStatus`: **not present — never existed in this codebase**
- The `Profile` interface as it currently stands (`src/types/user.types.ts`):

```ts
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```

- `AuthContextValue` exposes: `profile`, `session`, `isLoading`, `isAuthenticated`, plus auth action methods. No office-specific fields (`officeName`, `officeId`, `officeStatus`) exist anywhere in the context. The `DashboardLayout` reads `profile.name` and `profile.role` from context; those work fine. There is no missing field causing the loading hang — the hang is purely a stub rendering a static string.

## Best guess at root cause (one paragraph)

**Office Name body empty:** `ProfilePage.tsx` is a 10-line stub. It was scaffolded as a route placeholder and never implemented. The heading renders (which is why the sidebar label matches and the top-bar title appears), but there is no profile-edit form beneath it because none was written. This is not a runtime error or a missing data dependency — it is simply absent code.

**My Account body empty:** Identical situation. `SettingsPage.tsx` is a 10-line stub with only an `<h1>`. No password-change UI, no account settings form, no `ChangePasswordDialog` integration (that component exists and is used in `UserDashboard` but was never wired into the office settings page). Same root cause: the feature was never implemented.

**Add Property hang:** `NewPropertyPage.tsx` is an 11-line stub. The "Add Property" button in `PropertiesPage` is a `<Link>` — it navigates to `/office/properties/new`, which mounts this stub. The stub renders `{t.common.loading}` as a static `<p>` tag — that translation string is literally the word "Loading…" (or its Arabic equivalent), hard-coded as permanent content with no spinner, no `useState`, no `useEffect`, and no async operation. The page will never transition out of that state because there is no state to transition. The fix is to replace the stub with the actual `AddPropertyForm`; `governorates`, `areas`, and `propertyTypes` are still exported from `src/data/properties.ts` and are ready to be consumed.
