# Architecture

This document captures the design principles for Syria 14. The codebase
is mid-migration from a Lovable-generated scaffold to this target. Phases 0–5
in `docs/ROADMAP.md` track the migration.

---

## Layering

```
┌─────────────────────────────────────────────────────┐
│  pages/        Thin route components, composition    │
├─────────────────────────────────────────────────────┤
│  features/     Feature slices — auth, properties,    │
│                offices, favorites, inquiries, admin  │
│   ├─ components/  Feature-specific UI                │
│   ├─ hooks/       React Query hooks                  │
│   ├─ api/         Service layer (the ONLY layer that │
│   │               touches `supabase.*`)              │
│   ├─ schemas/     Zod validation                     │
│   └─ types.ts                                        │
├─────────────────────────────────────────────────────┤
│  shared/       Cross-cutting: ui/ lib/ hooks/ types/ │
├─────────────────────────────────────────────────────┤
│  integrations/supabase/   Generated client + types   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
                  Supabase (Postgres + Auth + Storage)
                          │
                          ▼
                  RLS — the real security boundary
```

## Rules of the road

1. **UI never touches Supabase directly.** Components → hooks → services →
   `supabase`. Anything else is a bug.
2. **Server state lives in React Query**, client state in React/Context.
   Never mix the two for the same data.
3. **Validate at every trust boundary.** Zod on every form input,
   Postgres `CHECK` + enums on every column, RLS on every table.
4. **Atomic multi-table mutations live in Postgres RPCs.** Don't compose
   2+ writes from the client — network drops orphan rows.
5. **RLS is the security boundary, not the UI.** UI hides actions; RLS
   refuses them. Defence in depth.
6. **Pages compose features. Features own logic. Components own UI.**
7. **Lazy-load what guests don't need.** No admin code in the guest bundle.
8. **Indexes before traffic.** Add them when the table is created, not after
   a slow-query report.
9. **Audit every privileged action.** Real-estate platforms have money on
   the line — un-attributed deletes are unacceptable.
10. **One source of truth per concern.** Geography in the DB, not in
    `data/properties.ts`. Auth state in one place, not three.

## Naming conventions

- File names: `kebab-case.tsx` for components, `kebab-case.ts` for everything
  else. Exception: the existing shadcn `ui/` files keep their lowercase form.
- React components: `PascalCase`.
- Hooks: `useThing` in `kebab-case` files (`use-thing.ts`).
- Service modules: `<resource>.service.ts` exporting named functions.
- Zod schemas: `<resource>.schema.ts` exporting `createXSchema`, `updateXSchema`.

## Environment

All env vars are validated at boot via `src/shared/config/env.ts`. There is
no other path. Any code wanting an env value imports `env` from that module.

## Domain rules

- **Approved offices publish properties directly** with `status='active'`. There is no per-listing admin approval step.
- **Offices cannot DELETE properties.** The RLS policy grants SELECT/INSERT/UPDATE only. Offices hide (`'hidden'`) and re-show (`'active'`) listings via the `property_status` enum.
- **Admins receive an in-app notification on every new property publish.** The `trg_notify_admins_on_property_publish` AFTER INSERT trigger fires a SECURITY DEFINER function — it cannot be spoofed from the client.

## Roles

See README for the role matrix. The implementation invariant:

- Role checks in RLS use `has_role(auth.uid(), 'role'::user_role)`.
- Frontend role checks use the `useRole()` hook (Phase 1).
- A user can hold multiple roles. The `user_roles` table is N:N, intentionally
  separate from `profiles` to prevent privilege-escalation via profile updates.

## i18n conventions

- All user-visible strings live in `src/lib/i18n/locales/ar.ts` and `en.ts`.
  The Arabic file defines the canonical `Translations` type; the English file satisfies it.
- Access translations via `const { t } = useI18n()`. Never inline string literals
  in JSX or component logic.
- Template variables use `{placeholder}` syntax and are replaced with
  `.replace('{placeholder}', value)` at the call site.
- A global Zod error map (`src/lib/zod-i18n.ts`) is installed in `I18nProvider`
  via `installZodErrorMap(t)` on every locale change. This means all Zod built-in
  messages (required, too short, invalid email, etc.) automatically respect the
  current locale. Zod `.refine()` messages must use `t.` keys and be wired via
  schema factory functions (not module-level constants) so they re-evaluate on
  locale change.
- Locale-aware date, currency, and relative-time formatting is in
  `src/lib/formatters.ts` (wraps `Intl.DateTimeFormat`, `Intl.NumberFormat`,
  `Intl.RelativeTimeFormat`).

## Accessibility (a11y) conventions

- Every public layout (`PageLayout`, `DashboardLayout`) begins with a
  visually-hidden skip link pointing to `#main-content`. The `<main>` element
  carries `id={MAIN_CONTENT_ID}` (imported from `src/lib/a11y.ts`).
- All icon-only interactive elements (`<button>`, `<a>`) must carry an
  `aria-label` drawn from the i18n dictionary. No hardcoded English in
  `aria-label` attributes.
- All `<form>` elements carry `noValidate` to suppress browser-native validation
  bubbles (which are always in the OS language, not the app locale).
- Every `<Label>` must have `htmlFor` matching its control's `id`. Floating
  labels or labels wrapping a control are acceptable alternatives.
- The heading hierarchy must be sequential within a page: one `<h1>` per route,
  sections use `<h2>`, sub-sections `<h3>`.
