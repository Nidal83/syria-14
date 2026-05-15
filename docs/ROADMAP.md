# Roadmap

Phased migration from the Lovable scaffold to a production-ready platform.
Each phase is independently deployable and reversible.

Numbering was renumbered after the scope expansion in May 2026; Phase 1's
sub-phases that haven't run yet have been folded into the new phases where
they naturally belong.

---

## ✅ Phase 0 — De-Lovable & foundation _(complete)_

Foundation hygiene. Zero behavior changes.

- Removed `lovable-tagger`, Lovable signatures, hardcoded Supabase URL/key.
- Validated env vars via `src/shared/config/env.ts` (Zod).
- TypeScript strict-ish: `noImplicitAny`, `strictFunctionTypes`,
  `strictBindCallApply`, `noImplicitThis`, `noFallthroughCasesInSwitch`,
  `noImplicitOverride`.
- ESLint: unused-vars, no-explicit-any, no-console all on (warn). Prettier integrated.
- Husky + lint-staged pre-commit.
- `vercel.json` with SPA rewrites + security headers.
- Renamed package; rewrote README; cleaned `index.html`; tightened `robots.txt`.

## ✅ Phase 1A — App shell & lazy routes _(complete)_

- `src/app/` skeleton: `route-paths.ts`, `AppProviders.tsx`, `AppRouter.tsx`.
- `src/features/auth/components/`: `ProtectedRoute.tsx`, `RoleRedirect.tsx`.
- `App.tsx` slimmed from 65 → 13 lines.
- React Router v6 `<Outlet />` + `<Suspense>` layout pattern.
- Every page lazy-loaded.
- Fixed `AuthContext.login` race; removed 5 of 6 `window.location.href`.
- Centralized `ROUTES` constants used everywhere (Header, Footer, pages).
- Deep-link return after login via `location.state.from`.
- AdminLogin actively rejects non-admin sign-ins.
- ProtectedRoute eliminates duplicated `if (!user)...` guards in pages.

## ✅ Phase 2A — Password UX foundations _(complete)_

- `PasswordInput` (show/hide, RTL-aware, a11y).
- Login + AdminLogin + Register: full `autocomplete` / `inputMode` /
  `id`/`htmlFor` / `minLength={8}` treatment.
- "Forgot password?" on Login.
- Fixed Phase 0's silent `typecheck` no-op (`tsc --noEmit` → `tsc -b --noEmit`).

## ✅ Phase 2B — Password reset & change _(complete)_

- `requestPasswordReset`, `updatePassword`, `verifyAndChangePassword` in AuthContext.
- `/forgot-password` + `/reset-password` pages.
- Listens for Supabase `PASSWORD_RECOVERY` event with 2s grace window.
- `ChangePasswordDialog` reusable component.
- Wired into `UserDashboard` settings.
- Email enumeration deliberately not exposed.

## ✅ Phase 2C — Email verification gate _(complete in code; needs Supabase Dashboard toggle)_

- `User.emailVerified` from `email_confirmed_at`.
- Login detects `email_not_confirmed` and routes to `/verify-email`.
- `/verify-email` page with resend.
- `resendVerificationEmail` in AuthContext.
- Register success → `/verify-email`.
- ⚠️ **Activate via Supabase Dashboard:** Auth → "Confirm email" = ON.
  See `docs/SUPABASE_SETUP.md`.

## ✅ Phase 2D — Google OAuth _(complete in code; needs Supabase Dashboard config)_

- `signInWithGoogle` in AuthContext.
- `GoogleSignInButton` (branded SVG, accessible).
- Added to Login + Register (user mode only).
- ⚠️ **Activate via Supabase Dashboard + Google Cloud Console.**
  See `docs/SUPABASE_SETUP.md`.

## ✅ Phase 2D — Content & polish _(complete)_

- Hero image replaced with high-res Damascus photo (compressed to 385 KB JPEG).
- Logo replaced with real Syria 14 brand mark (`/public/logo-syria14.png`).
- Added `city` TEXT column to `properties` table; backfilled demo rows.
- Fixed admin RLS policies (`properties`, `profiles`) to use `profiles.role`
  instead of the broken `has_role()` / `user_roles` path.
- Built SearchPage from stub: full URL-param filtering, skeleton loader,
  active-filter chips.
- Built PropertyDetailPage: image gallery, related properties, WhatsApp/phone CTAs.
- Built UsersPage approval flow: Approve/Reject dialogs, creates `offices` record.
- Featured Properties section on home page (3 cards from `sampleProperties`,
  bilingual, links to `/search`). Phase 3 will replace with real DB data.
- Regenerated Supabase TypeScript types; fixed all TypeScript errors.

---

## 🔜 Phase 2E — Password policy + rate limit + CAPTCHA

- Server-side password policy in Supabase Dashboard.
- hCaptcha on Login / Register / Forgot Password / Inquiry / Contact.
- Tightened Supabase rate limits.

## Phase 2F — Role enum expansion

- Migration: add `office_member` + `moderator` to `user_role` enum.
- Update TypeScript types and `<ProtectedRoute>` typings.

## Phase 3 — Database hardening + slugs + categories

- Seed `governorates` + `areas` from `data/properties.ts`, then delete the hardcoded file.
- Slug columns on `offices` + `properties` (auto-generated via Postgres function).
- `property_types` becomes a real table (admin-manageable categories).
- Enums: `property_status`, `inquiry_status`, `audit_action`.
- `updated_at` + `deleted_at` everywhere; soft-delete pattern.
- `audit_logs` table + generic trigger.
- `contact_messages` table.
- Indexes (zero currently exist).
- Storage bucket constraints: path = `auth.uid()/...`, size, MIME.
- RPCs: `get_current_user_bundle`, `register_office`,
  `create_property_with_images`, `invite_office_member_by_email`.
- Per-command RLS policies (replace `FOR ALL`).
- Seed 3 demo offices + properties + test users.

## Phase 4 — URL migration

- `/property/:id` → `/property/:slug` (with 301 from old).
- New `/offices/:slug` route for office public profile pages.
- Update internal links + sitemap.

## Phase 5 — Admin system

- **Subdomain split (`admin.syria14.com`)** at deploy time.
- Admin layout shell with sidebar + breadcrumbs + back navigation.
- Admin MFA (TOTP) requirement.
- Split `AdminDashboard` (777 lines) into:
  - Overview / metrics
  - Users
  - Offices
  - Property moderation
  - Categories
  - Featured listings
  - Subscriptions
  - Reports
  - Analytics
  - Settings
- RBAC: `admin` does all; `moderator` is scoped to moderation actions.

## Phase 6 — Office dashboard UX overhaul

- Split `OfficeDashboard` (1320 lines) into:
  - Overview
  - Properties list + management
  - Property images management
  - Inquiries / messages
  - Office profile editing
  - Members management
  - Subscription / billing
- Breadcrumbs + back navigation.
- Migrate `AddPropertyForm` to react-hook-form + Zod.
- React Query for all dashboard data.

## Phase 7 — Dynamic property-type menu

- Header dropdown driven by `property_types` table.
- Filter pages tied to category slugs.

## Phase 8 — PWA

- `vite-plugin-pwa` + `manifest.json` + icons (incl. maskable).
- Workbox service worker: precache shell, network-first for storage images.
- Install prompt UX.
- Lighthouse PWA + mobile responsiveness pass.

## Phase 9 — Production prep & launch

- Image optimization (sharp / vite-imagetools, WebP/AVIF).
- Per-page SEO via `react-helmet-async`; dynamic property meta; sitemap.
- Sentry.
- CI workflow (`lint:ci` + typecheck + test + build on PR).
- Cookie / privacy banner.
- Web Vitals + accessibility audit.

---

## Decisions for the record

- **Admin URL strategy:** subdomain split (`admin.syria14.com`) at Phase 5 deploy time.
- **Admin MFA timing:** addressed with the rest of admin work in Phase 5.
- **Image storage:** Supabase Storage; Cloudflare CDN consideration deferred to Phase 9.
- **Deployment target:** Vercel.
