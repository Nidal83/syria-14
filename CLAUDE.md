# Working on this project

This project is **in production** on Vercel + Supabase.
Live URL: https://syria-14.vercel.app
Treat all changes accordingly.

## Required workflow

1. **Never commit to `main` directly.**
   - Create a feature branch: `git checkout -b <type>/<short-name>`
     where `<type>` is one of: feat, fix, chore, docs, refactor.
   - Push the branch and open a pull request against `main`.
   - Vercel auto-creates a preview deployment for the branch. The user
     tests the preview URL before merging.

2. **Never apply database migrations automatically.**
   - Migration SQL goes in `supabase/migrations/<timestamp>_<name>.sql`.
   - Do NOT run `supabase db push`, `supabase db reset`, or any other
     command that mutates the live database.
   - At the top of every migration file, leave a comment block telling
     the user how to apply it manually via Supabase Studio → SQL Editor.
   - The user applies migrations themselves after reviewing the SQL.

3. **Package manager is Bun.**
   Use `bun install` for dependencies (the project has `bun.lock`/`bun.lockb`).
   Scripts can run via `bun run <name>` or `npm run <name>` — both work
   because Bun reads package.json. Prefer `bun run` for consistency.

4. **Verification before commit.**
   Run all five and ensure they pass:

```
   bun run typecheck
   bun run lint:ci
   bun run format:check
   bun run build
   bun test
```

If any fails, do NOT commit. Stop and report.

5. **Read these docs at the start of every session:**
   - `docs/ARCHITECTURE.md` — project structure and conventions
   - `docs/ROADMAP.md` — phase status, completed vs pending work
   - `docs/SUPABASE_SETUP.md` — what's configured in Supabase

6. **Respect the scope guardrails in every prompt.**
   Every prompt specifies which files may be touched and which are
   off-limits. If a related issue exists in an off-limits file, record
   it in the commit message — do NOT fix it in this session.

## Environment context

- Auto-deploy: pushes to `main` deploy to Vercel production immediately.
  Pushes to any other branch generate a Vercel preview deployment.
- Database: single Supabase project (no separate staging).
- Before any migration, the user should take a manual backup via
  Supabase Dashboard → Database → Backups.
- CI: GitHub Actions runs typecheck + lint + build + test on every push
  and every pull request. Required for merge once branch protection is on.
