# Syria Homes Nest

A scalable real-estate platform for Syria — bilingual (Arabic / English), built on
React, TypeScript, Vite, Tailwind, and Supabase.

> **Status:** Phase 0 of refactor complete (foundation hygiene).
> Phases 1–5 are in `docs/ROADMAP.md`.

---

## Stack

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Framework   | React 18 + Vite + SWC                         |
| Language    | TypeScript                                    |
| Styling     | Tailwind CSS + shadcn/ui (Radix primitives)   |
| State       | React Query (server) + Context (client)       |
| Forms       | react-hook-form + Zod                         |
| Backend     | Supabase (Postgres + Auth + Storage + RLS)    |
| Routing     | React Router v6                               |
| i18n        | Custom lightweight context (ar / en)          |
| Animation   | Framer Motion                                 |
| Testing     | Vitest + Testing Library                      |
| Deployment  | Vercel                                        |

---

## Getting started

### Prerequisites

- Node.js **20+**
- npm 10+ (or pnpm / bun — repo includes a `bun.lockb`)
- A Supabase project (or use the shared dev one — ask the team)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your values
cp .env.example .env

# 3. Run dev server
npm run dev
```

Open <http://localhost:8080>.

### Environment variables

All variables are validated at boot via `src/shared/config/env.ts` (Zod). If anything
is missing or malformed, the app fails immediately with a clear error.

| Variable                        | Required | Notes                                  |
| ------------------------------- | -------- | -------------------------------------- |
| `VITE_SUPABASE_URL`             | yes      | e.g. `https://xxx.supabase.co`         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes      | The `anon` public key                  |
| `VITE_SUPABASE_PROJECT_ID`      | no       | Used by some Supabase tooling          |
| `VITE_APP_NAME`                 | no       | Defaults to "Syria Homes Nest"         |
| `VITE_APP_URL`                  | no       | The canonical URL of this deployment   |

> ⚠️ Never commit `.env`. `.env.example` is the canonical template.

---

## Scripts

| Script              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start Vite dev server on port 8080                   |
| `npm run build`     | Production build                                     |
| `npm run preview`   | Preview the production build locally                 |
| `npm run typecheck` | Run `tsc --noEmit` over the project                  |
| `npm run lint`      | ESLint, failing on any warning (CI mode)             |
| `npm run lint:fix`  | ESLint with auto-fix                                 |
| `npm run format`    | Prettier write                                       |
| `npm run format:check` | Prettier check (CI-friendly)                      |
| `npm run test`      | Run the test suite once                              |
| `npm run test:watch`| Watch mode                                           |

---

## Project structure (post Phase 1, in progress)

```
src/
├── app/                  # App shell, providers, router, error boundary
├── features/             # Feature-sliced: auth, properties, offices, …
│   └── <feature>/
│       ├── api/          # Service layer (the only place that talks to Supabase)
│       ├── hooks/        # React Query hooks
│       ├── components/   # Feature-specific components
│       ├── schemas/      # Zod schemas
│       └── types.ts
├── pages/                # Thin route components, compose feature components
├── shared/
│   ├── ui/               # shadcn primitives
│   ├── components/       # Cross-cutting components (Header, Footer, etc)
│   ├── hooks/            # Cross-cutting hooks
│   ├── lib/              # Utilities (cn, formatters, validators)
│   ├── config/           # env.ts, routes.ts, constants.ts
│   └── types/            # Global types
├── i18n/                 # Translations + LanguageContext
└── integrations/supabase # Generated client + types (do not edit by hand)
```

See `docs/ARCHITECTURE.md` for the design principles.

---

## Roles

| Role             | Capabilities                                                   |
| ---------------- | -------------------------------------------------------------- |
| `guest`          | Browse, search, view active properties                         |
| `user`           | + Favorites, inquiries, profile                                |
| `office`         | + CRUD own properties, manage members, view inquiries          |
| `office_member`  | Same as `office` scoped to one office, no admin actions        |
| `moderator` (v2) | Approve/reject offices and properties, manage inquiries        |
| `admin`          | Everything + grant roles + audit log (granted via SQL only)    |

---

## Deployment (Vercel)

Push to `main` triggers a deploy. Required env vars in Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_APP_URL` (set to the production domain)

The `vercel.json` in the repo handles SPA rewrites so deep links work.

## Supabase setup

Several auth flows (password reset, email verification, Google OAuth) depend
on configuration in the Supabase Dashboard that **cannot be done from code**.
See `docs/SUPABASE_SETUP.md` for the full checklist.

---

## Contributing

1. Branch from `main`.
2. Husky's `pre-commit` will lint-and-format staged files.
3. PRs should pass `npm run typecheck && npm run lint && npm run build`.

---

## License

Private — © Syria Homes Nest.
