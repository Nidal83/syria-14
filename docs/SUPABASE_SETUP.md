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

| Setting | Value |
|---|---|
| Enable email signup | ON |
| **Confirm email** | **ON** |
| Secure email change | ON |
| Allow new users to sign up | ON |

When this is ON, new sign-ups must click the link in the confirmation email
before they can sign in. Our app handles this:

- Registration redirects to `/verify-email` with the email pre-filled.
- Login attempts with an unconfirmed email get bounced to `/verify-email`
  (we detect Supabase's `email_not_confirmed` error code).
- `/verify-email` has a "Resend confirmation link" button.

---

## 3. Custom SMTP (strongly recommended before launch)

**Where:** Auth → Emails → SMTP Settings

Supabase's default email infrastructure is rate-limited (≈30 emails/hour on
the free tier) and uses `noreply@mail.app.supabase.io` as the sender — neither
is acceptable for a production-facing real-estate platform.

Recommended providers (all have free tiers):

| Provider | Free tier | Setup difficulty |
|---|---|---|
| Resend | 3,000/month | Easy (5 min) |
| SendGrid | 100/day | Medium |
| AWS SES | First 62,000/month free if sending from EC2 | Hard |

After SMTP is configured, customize the email templates under Auth → Emails
→ Templates:

- **Confirm signup**
- **Reset password**
- **Magic Link**
- **Change email address**

Translate to Arabic + English, replace the sender name with "Syria14".

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

| Setting | Recommended |
|---|---|
| Minimum password length | 8 |
| Required characters | "Letters and digits" or stronger |
| Leaked password protection | ON (Pro plan) |

Our forms already enforce `minLength={8}` client-side; this server-side
setting is the actual enforcement and must match.

---

## 6. Rate limiting (Phase 2E — planned)

**Where:** Auth → Rate Limits

Supabase's defaults are generous. Tightening recommended:

| Endpoint | Default | Recommended for prod |
|---|---|---|
| Token refreshes per IP / 5min | 1,800 | keep |
| Sign-in attempts per IP / 5min | 30 | keep |
| Sign-up attempts per IP / 5min | 30 | 10 |
| Password resets per IP / 5min | 5 | keep |
| OTPs per IP / 5min | 5 | keep |

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
