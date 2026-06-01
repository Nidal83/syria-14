# Bookings + farm-rental schema — decision record

Status: migration written, **not yet applied** to the live database.
Discovery was done against the live Supabase project `Syria 14`
(`ggsxvvtkmmpsceysttcn`, Postgres 17) plus the migration history in
`supabase/migrations/`.

## 1. Form of `property_type`

`property_type` is a **plain `TEXT` column**, not an enum and not a
foreign key:

```
property_type  text  NOT NULL  DEFAULT ''::text
```

There is a separate `category text NOT NULL DEFAULT 'residential'`
column (residential / commercial / land / industrial / agricultural in
the i18n dictionary) — that is the broad bucket. `property_type` is the
finer free-text type (apartment / villa / land / shop / …).

**Decision (A3):** TEXT → no DDL is needed to "add" `'farm'`. The
migration documents the convention in a comment: a farm listing sets
`property_type = 'farm'` (lowercase, exact). No enum to alter, no
property_types table to insert into.

## 2. Currency column on `properties`

Exists:

```
currency  text  NOT NULL  DEFAULT 'USD'::text
```

So `bookings.currency text NOT NULL` mirrors the same text convention.
The booking captures the property's `currency` at booking time
(snapshot), alongside `daily_rate_snapshot`.

## 3. `notifications` table & `notification_type`

`notifications` **is present** (shipped by
`20260517000000_office_system.sql`). Columns:

```
id, user_id, type, title, body, link, data (jsonb), read_at,
email_sent_at, created_at
```

`notification_type` current values:
`property_published, office_approved, office_rejected, new_inquiry, system`.

**Decision (A4):** notifications present → wire the notification
triggers (Phase C11). Four new enum values are added:
`booking_request, booking_confirmed, booking_rejected, booking_cancelled`.

`btree_gist` extension is **not** enabled yet → the migration enables it
(needed for the GiST EXCLUDE constraint).

`has_role(_user_id uuid, _role user_role)` exists; `user_role` =
`{user, pending_office, office, admin}`. The admin SELECT policy uses
`public.has_role(auth.uid(), 'admin'::user_role)`.

`bookings` table does **not** exist (good — clean create).

## 4. Conflicts between the SPEC and reality, and resolutions

### 4a. `user_id NOT NULL ... ON DELETE SET NULL` is self-contradictory (RESOLVED)

The spec's `bookings.user_id` is `uuid NOT NULL REFERENCES auth.users(id)
ON DELETE SET NULL`. These cannot coexist: deleting the referenced
`auth.users` row would try to set `user_id = NULL` on a `NOT NULL`
column, raising an error and **blocking the user deletion**.

The spec also states bookings are _immutable history_ (no DELETE policy,
"rows are preserved for audit"). That intent is only honoured if the
booking survives the deletion of a user account — i.e. `SET NULL` is the
intended behaviour and the `NOT NULL` is the oversight.

**Resolution:** drop `NOT NULL` on `user_id` (column is nullable) and
keep `ON DELETE SET NULL`. The INSERT RLS policy still forces
`user_id = auth.uid()` at creation, so it is only ever null after the
owning account is deleted. Everything downstream tolerates null:
`bookings_select_own_user` (`user_id = auth.uid()`) and the
`v_is_owner_user` check in `update_booking_status` simply evaluate false.

### 4b. EXCLUDE `ADD CONSTRAINT` is not idempotent (RESOLVED)

`ALTER TABLE ... ADD CONSTRAINT bookings_no_overlap EXCLUDE ...` errors
on a second apply. The quality checklist requires the migration to be
re-runnable. **Resolution:** wrap it in a `DO $$ ... IF NOT EXISTS (…
pg_constraint …) $$` guard, same pattern the spec uses for the
`properties_min_le_max_booking_days` check.

### 4c. `ALTER TYPE ... ADD VALUE` + transaction (RESOLVED by file split)

The Supabase CLI wraps each migration file in a single transaction, and
a newly added enum value cannot be _used_ in the same transaction it was
added. **Resolution:** the notification work lives in a **second
migration file** `…_bookings_notifications.sql`. The four `ADD VALUE`
statements commit in their own migration transaction before the
booking-lifecycle triggers (which reference those values at runtime)
ever fire. The two files must be applied in order.

### 4d. `daterange(..., '[]')` inclusive bounds (FOLLOWING SPEC)

The EXCLUDE uses an inclusive `[]` range, so two bookings that share an
endpoint day overlap and are rejected (no same-day checkout/checkin
turnover). This follows the spec verbatim; flagged here so the 2b/2c UI
authors know the calendar semantics.

### 4e. Office _members_ not covered (FOLLOWING SPEC)

`office_members` exist in this codebase, but the spec's office policies
key off `offices.owner_id` only. Followed as written: only the office
**owner** can read/transition bookings. Extending to office members is a
clean follow-up if needed, mirroring the property_images member policies.

## 5. Objects this migration set creates

### File 1 — `20260601120000_bookings_schema.sql`

- **Extension:** `btree_gist` (idempotent).
- **Columns on `properties`** (all nullable; farms only):
  `daily_price`, `weekly_price`, `monthly_price` `numeric(12,2)`;
  `min_booking_days`, `max_booking_days` `int` (each `>= 1` when set).
- **Table-level CHECK** `properties_min_le_max_booking_days`
  (`min <= max` when both set), guarded.
- **Enum** `booking_status`:
  `pending, confirmed, rejected, cancelled, completed`.
- **Table** `public.bookings`:
  `id, property_id, user_id (nullable — see 4a), start_date, end_date,
status, daily_rate_snapshot, currency, total_price, customer_note,
office_note, created_at, updated_at, confirmed_at, rejected_at,
cancelled_at, completed_at`; CHECKs `bookings_valid_range`
  (`end_date > start_date`) and `bookings_not_in_past`
  (`start_date >= '2020-01-01'`).
- **Function + trigger** `fn_bookings_touch_updated_at` /
  `trg_bookings_touch_updated_at` (BEFORE UPDATE, bumps `updated_at`).
- **Indexes:** `idx_bookings_property_status`, `idx_bookings_user_status`,
  `idx_bookings_date_range`.
- **EXCLUDE constraint** `bookings_no_overlap`
  (`GIST (property_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
WHERE status IN ('pending','confirmed')`), guarded for idempotency.
- **RLS** on `bookings` (enabled) + policies:
  `bookings_select_own_user`, `bookings_select_office`,
  `bookings_select_admin`, `bookings_insert_own`.
  **No** UPDATE policy (transitions go through the function),
  **no** DELETE policy.
- **SECURITY DEFINER function** `update_booking_status(uuid,
booking_status, text)` — the only legitimate status-transition path;
  `REVOKE … FROM public`, `GRANT … TO authenticated`.

### File 2 — `20260601120100_bookings_notifications.sql`

- **`notification_type` ADD VALUE** (idempotent):
  `booking_request, booking_confirmed, booking_rejected, booking_cancelled`.
- **Functions + triggers:**
  `fn_notify_office_on_new_booking` / `trg_notify_office_on_new_booking`
  (AFTER INSERT → notify office owner);
  `fn_notify_on_booking_status_change` /
  `trg_notify_on_booking_status_change` (AFTER UPDATE → notify the
  counter-party on confirmed / rejected / cancelled).

## 6. Apply order (the user does this in Supabase Studio)

1. Back up: Dashboard → Database → Backups.
2. Run `20260601120000_bookings_schema.sql`.
3. Run `20260601120100_bookings_notifications.sql`.
4. `supabase gen types typescript --linked > src/integrations/supabase/types.ts`.

`types.ts` is intentionally **left unregenerated in this PR** — it can
only be generated from the live schema after the migration is applied.
Prompts 2b/2c regenerate and consume it.
