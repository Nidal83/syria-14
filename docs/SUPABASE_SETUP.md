# Supabase Dashboard Setup

Phase 2 introduces flows that **depend on Supabase Dashboard configuration**.
The code is correct; the dashboard knobs need to match. This guide is the
single reference for what must be set up where.

Open <https://supabase.com/dashboard> → select your project for every step
below.

---

## 1. Redirect URL allow-list (required for password reset & Google OAuth)

**Where:** Auth → URL Configuration

**Site URL** — set to your canonical production URL:

```
https://syria14.com
```

**Redirect URLs** — paste every URL that auth flows might bounce through.
Wildcards (`**`) are allowed in Supabase. Suggested set:

```
http://localhost:8080/**
https://*.vercel.app/**
https://syria14.com/**
```

The `/**` wildcard covers `/reset-password`, `/verify-email`, `/`, and any
future auth callback URL without needing to update Supabase every release.

> ⚠️ Without these entries, `resetPasswordForEmail()` will silently fail
> to redirect — the user clicks the email link and lands on a Supabase
> error page.

---

## 2. Email confirmation (Phase 2C — required before launch)

**Where:** Auth → Sign In / Up → Email

| Setting                    | Value  |
| -------------------------- | ------ |
| Enable email signup        | ON     |
| **Confirm email**          | **ON** |
| Secure email change        | ON     |
| Allow new users to sign up | ON     |

When this is ON, new sign-ups must click the link in the confirmation email
before they can sign in. Our app handles this:

- Registration redirects to `/verify-email` with the email pre-filled.
- Login attempts with an unconfirmed email get bounced to `/verify-email`
  (we detect Supabase's `email_not_confirmed` error code).
- `/verify-email` has a "Resend confirmation link" button.

---

## 3. Email infrastructure (Resend)

Supabase's default email infrastructure is rate-limited (≈30 emails/hour on
the free tier) and uses `noreply@mail.app.supabase.io` as the sender — neither
is acceptable for a production real-estate platform. We replace it with Resend.

### 3.1 Create a Resend account

Sign up at <https://resend.com>. The free tier includes 3,000 emails/month and
100/day — sufficient for most pre-launch workloads.

### 3.2 Verify your domain

In the Resend dashboard → Domains → Add domain:

1. Enter `syria14.com`.
2. Resend generates three DNS records (SPF, DKIM, DMARC). Add them to your
   DNS provider (Cloudflare, Route 53, etc.).
3. Click **Verify** — all three records must pass before you can send from
   a `@syria14.com` address.
4. Until verification passes, Resend only accepts `@resend.dev` sender
   addresses (useful for development).

### 3.3 Create an API key

Resend dashboard → API Keys → Create API key:

- Name: `supabase-smtp` (or `syria14-production`)
- Permission: **Sending access** (not full access)
- Domain: restrict to `syria14.com`
- Copy the key — you'll need it in steps 3.4 and 3.6.

### 3.4 Configure Supabase SMTP

**Where:** Supabase Dashboard → Auth → Emails → SMTP Settings → Enable custom SMTP

| Field        | Value                   |
| ------------ | ----------------------- |
| Host         | `smtp.resend.com`       |
| Port         | `465`                   |
| Username     | `resend`                |
| Password     | _(your Resend API key)_ |
| Sender name  | `Syria14`               |
| Sender email | `noreply@syria14.com`   |

Save settings. Supabase now routes all auth emails through Resend.

### 3.5 Paste the branded auth templates

**Where:** Supabase Dashboard → Auth → Emails → Templates

For each of the six template types, copy the corresponding HTML file from
`docs/email-templates/` in this repository and paste it into the template
editor. Use the subject line from the comment at the top of each file.

| Template             | File                                         | Subject (EN)                   |
| -------------------- | -------------------------------------------- | ------------------------------ |
| Confirm signup       | `docs/email-templates/confirm-signup.html`   | Confirm your email — Syria14   |
| Reset password       | `docs/email-templates/reset-password.html`   | Reset your Syria14 password    |
| Magic link           | `docs/email-templates/magic-link.html`       | Your Syria14 sign-in link      |
| Change email address | `docs/email-templates/change-email.html`     | Confirm your new email         |
| Invite user          | `docs/email-templates/invite.html`           | You've been invited to Syria14 |
| Reauthentication OTP | `docs/email-templates/reauthentication.html` | Confirm your identity          |

Each template is bilingual (Arabic RTL + English LTR), styled with the Syria 14
gold brand color (`#c89b3c`), and uses Supabase's Go template variables
(`{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`).

### 3.6 Set the RESEND_API_KEY secret for Edge Functions

The `send-notification-email` Edge Function also uses Resend for transactional
notifications. Set the secret so it can call the API:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

Until this secret is set the function exits cleanly with `200 OK` — the
in-app notification system keeps working with no side effects.

### 3.7 Set the APP_URL secret

The Edge Function constructs deep-links using the site URL:

```bash
supabase secrets set APP_URL=https://syria14.com
```

For local development you can point this at `http://localhost:8080`.

### 3.8 Verify end-to-end

1. Register a new test user → the confirmation email should arrive within
   a few seconds, from `noreply@syria14.com`, with the bilingual Syria 14
   template.
2. In the Resend dashboard → Logs, confirm delivery status is `delivered`.
3. Test each flow: confirm signup → reset password → magic link.

---

## 4. Google OAuth provider (Phase 2D)

**Where:** Auth → Sign In / Up → Auth Providers → Google

### 4.1 Create Google OAuth credentials

1. Go to <https://console.cloud.google.com> → create a project (or use an
   existing one).
2. APIs & Services → OAuth consent screen:
   - User type: **External**
   - App name: Syria14
   - User support email: your support address
   - App domain: `https://syria14.com`
   - Developer contact: your dev address
   - Scopes: `userinfo.email`, `userinfo.profile`, `openid`
3. APIs & Services → Credentials → Create Credentials → OAuth client ID:
   - Application type: **Web application**
   - Name: Syria14 Production (create a separate one for local dev)
   - Authorized JavaScript origins:
     - `https://syria14.com`
     - `http://localhost:8080` (for the dev client)
   - Authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Click Create → copy the **Client ID** and **Client Secret**.

### 4.2 Plug into Supabase

In Supabase Auth → Providers → Google:

- Enable: ON
- Client ID: from step 4.1
- Client Secret: from step 4.1
- Skip nonce check: leave OFF (default)

### 4.3 Verify

- Local: visit `http://localhost:8080/login` → "Continue with Google" should
  open Google's consent screen and bounce back signed in.
- Note: Google sign-ups always create a `user` role. Office accounts must
  use email/password registration to capture business metadata.

---

## 5. Password policy (Phase 2E — planned)

**Where:** Auth → Sign In / Up → Auth Policies

| Setting                    | Recommended                      |
| -------------------------- | -------------------------------- |
| Minimum password length    | 8                                |
| Required characters        | "Letters and digits" or stronger |
| Leaked password protection | ON (Pro plan)                    |

Our forms already enforce `minLength={8}` client-side; this server-side
setting is the actual enforcement and must match.

---

## 6. Rate limiting (Phase 2E — planned)

**Where:** Auth → Rate Limits

Supabase's defaults are generous. Tightening recommended:

| Endpoint                       | Default | Recommended for prod |
| ------------------------------ | ------- | -------------------- |
| Token refreshes per IP / 5min  | 1,800   | keep                 |
| Sign-in attempts per IP / 5min | 30      | keep                 |
| Sign-up attempts per IP / 5min | 30      | 10                   |
| Password resets per IP / 5min  | 5       | keep                 |
| OTPs per IP / 5min             | 5       | keep                 |

For larger projects, consider hCaptcha (Auth → Settings → Captcha protection
→ ON) which adds CAPTCHA challenges on top of rate limits.

---

## 7. JWT settings

**Where:** Auth → JWT Settings

Defaults are sane:

- Access token TTL: 3600s (1 hour)
- Refresh token TTL: 5184000s (60 days)

For admin accounts, consider a separate shorter access token TTL after
Phase 5 (subdomain split + MFA).

---

## 8. Storage policies (Phase 3 — planned)

**Where:** Storage → property-images → Policies

To be tightened in Phase 3 (Database hardening). Currently any authenticated
user can upload any binary up to 50MB. Phase 3 will add:

- Path prefix enforcement (`{auth.uid()}/...`)
- File-size check via Postgres RLS using `octet_length`
- MIME-type allowlist

---

## Sentry setup (Stage 2)

Production error tracking. Sign up free at sentry.io.

### One-time setup

1. Create a Sentry organization + a "React" project for Syria14.
2. Copy the DSN from Project Settings → Client Keys (DSN).
3. Set `VITE_SENTRY_DSN` in Vercel project settings for Production and
   Preview environments. Local dev can leave it empty.
4. Generate an auth token: User Settings → Auth Tokens → "Create New".
   Scopes: `project:releases` and `org:read`.
5. In Vercel project settings, add (server-side env, **NOT** `VITE_*`):
   ```
   SENTRY_AUTH_TOKEN
   SENTRY_ORG       (your Sentry org slug)
   SENTRY_PROJECT   (your Sentry project slug, e.g. syria14-web)
   ```
6. Redeploy. Source maps upload automatically; errors will resolve with
   readable component names instead of minified gibberish.

### Verifying it works

Open the deployed site → DevTools → run:

```js
throw new Error('Sentry test ' + Date.now());
```

Within a minute, the error appears in Sentry with stack trace + URL + user agent.

---

## Verification checklist

After everything above is configured, smoke-test:

- [ ] Sign up new user → receive confirmation email
- [ ] Click confirmation link → land on app, signed in
- [ ] Sign in with wrong password → see error toast
- [ ] Sign in without confirming first → bounced to /verify-email
- [ ] Click "Forgot password?" on login → enter email → receive reset email
- [ ] Click reset link → land on /reset-password → set new password → can log in with it
- [ ] Settings → Change password → works and old password is rejected
- [ ] "Continue with Google" on login → signs in via Google
- [ ] Refresh after sign-in → session persists
