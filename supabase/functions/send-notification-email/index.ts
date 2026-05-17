// =============================================================================
// Edge Function: send-notification-email
// Triggered by a Supabase Database Webhook on public.notifications INSERT.
// =============================================================================
//
// SETUP (user must complete in Supabase Dashboard):
//
//   1. Deploy this function:
//        supabase functions deploy send-notification-email
//
//   2. Set the Resend API key secret:
//        supabase secrets set RESEND_API_KEY=re_xxxxx
//
//   3. Create the Database Webhook:
//        Supabase Dashboard → Database → Webhooks → Create webhook
//          Name:    notification_email_dispatch
//          Table:   public.notifications
//          Events:  INSERT
//          Method:  POST
//          URL:     <Edge Function URL from Dashboard → Edge Functions>
//          Headers: Authorization: Bearer <service-role JWT>
//
//   4. Verify your sender domain at https://resend.com (DKIM, SPF, return-path).
//      Until the domain is verified, Resend only accepts @resend.dev sender addresses.
//
//   5. Set the SITE_URL secret if not already set:
//        supabase secrets set SITE_URL=https://syria14.com
//
//   See docs/SUPABASE_SETUP.md → "Notifications email setup" for full instructions.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://syria14.com';
const FROM_ADDRESS = 'Syria14 <noreply@syria14.com>';

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // If Resend is not configured, skip gracefully — in-app system keeps working
  if (!RESEND_API_KEY) {
    console.warn('[send-notification-email] RESEND_API_KEY not set; skipping email dispatch');
    return new Response('OK', { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  // Supabase webhooks send { type, table, schema, record, old_record }
  const notification = (body.record ?? body) as {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
  };

  if (!notification?.id || !notification?.user_id) {
    console.error('[send-notification-email] Invalid payload', body);
    return new Response('Invalid payload', { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Look up user email
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    notification.user_id,
  );
  if (userErr || !userData.user?.email) {
    console.error('[send-notification-email] User not found', userErr);
    return new Response('User not found', { status: 404 });
  }
  const toEmail = userData.user.email;

  // 2. Check notification_prefs on profiles
  const { data: profileData } = await admin
    .from('profiles')
    .select('notification_prefs')
    .eq('id', notification.user_id)
    .maybeSingle();

  const prefs = (profileData?.notification_prefs as Record<string, boolean> | null) ?? {};

  // Map notification type to preference key
  const prefKeyMap: Record<string, string> = {
    new_inquiry: 'inquiries',
    system: 'system',
  };
  const prefKey = prefKeyMap[notification.type];
  if (prefKey && prefs[prefKey] === false) {
    console.info('[send-notification-email] User opted out of', prefKey);
    return new Response('OK', { status: 200 });
  }

  // 3. Build email
  const viewUrl = notification.link ? `${SITE_URL}${notification.link}` : SITE_URL;
  const htmlBody = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">${notification.title}</h2>
      ${notification.body ? `<p style="color:#555;margin:0 0 16px">${notification.body}</p>` : ''}
      <a href="${viewUrl}"
         style="display:inline-block;background:#0070f3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
        View
      </a>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
      <p style="color:#999;font-size:12px">Syria14 — Real Estate Platform</p>
    </div>
  `;

  // 4. Send via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [toEmail],
      subject: notification.title,
      html: htmlBody,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error('[send-notification-email] Resend error', resendRes.status, err);
    return new Response('Email send failed', { status: 500 });
  }

  // 5. Mark email_sent_at on the notification row
  await admin
    .from('notifications')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', notification.id);

  console.info(
    '[send-notification-email] Email sent to',
    toEmail,
    'for notification',
    notification.id,
  );
  return new Response('OK', { status: 200 });
});
