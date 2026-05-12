# Architecture

This document captures the design principles for Syria Homes Nest. The codebase
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

## Roles

See README for the role matrix. The implementation invariant:
- Role checks in RLS use `has_role(auth.uid(), 'role'::user_role)`.
- Frontend role checks use the `useRole()` hook (Phase 1).
- A user can hold multiple roles. The `user_roles` table is N:N, intentionally
  separate from `profiles` to prevent privilege-escalation via profile updates.
