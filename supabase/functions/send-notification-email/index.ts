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
//   3. Set the app URL secret:
//        supabase secrets set APP_URL=https://syria14.com
//
//   4. Create the Database Webhook:
//        Supabase Dashboard → Database → Webhooks → Create webhook
//          Name:    notification_email_dispatch
//          Table:   public.notifications
//          Events:  INSERT
//          Method:  POST
//          URL:     <Edge Function URL from Dashboard → Edge Functions>
//          Headers: Authorization: Bearer <service-role JWT>
//
//   5. Verify your sender domain at https://resend.com (DKIM, SPF, return-path).
//      Until the domain is verified, Resend only accepts @resend.dev sender addresses.
//
//   See docs/SUPABASE_SETUP.md § 3 for full instructions.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderEmail, sendViaResend } from '../_shared/email-template.ts';
import type { EmailContent } from '../_shared/email-template.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://syria14.com';
const FROM_ADDRESS = 'Syria14 <noreply@syria14.com>';

function buildEmailContent(type: string, title: string, viewUrl: string): EmailContent {
  const ctaLabel = { ar: 'عرض الإشعار', en: 'View notification' };

  if (type === 'new_inquiry') {
    return {
      subject: title,
      title: { ar: 'استفسار جديد', en: 'New inquiry' },
      body: {
        ar: 'وصل إليك استفسار جديد على إحدى عقاراتك. اضغط الزر أدناه لعرض التفاصيل.',
        en: 'A new inquiry has been received for one of your properties. Click the button below to view the details.',
      },
      cta: { url: viewUrl, label: ctaLabel },
      footer: {
        ar: 'إذا كنت لا تريد تلقّي هذه الإشعارات، عدّل تفضيلاتك من إعدادات الحساب.',
        en: 'To stop receiving these emails, update your notification preferences in account settings.',
      },
    };
  }

  // Generic fallback — covers 'system' and any future types
  return {
    subject: title,
    title: { ar: 'إشعار من سيريك 14', en: 'Syria14 notification' },
    body: {
      ar: title,
      en: title,
    },
    cta: { url: viewUrl, label: ctaLabel },
    footer: {
      ar: 'إذا كنت لا تريد تلقّي هذه الإشعارات، عدّل تفضيلاتك من إعدادات الحساب.',
      en: 'To stop receiving these emails, update your notification preferences in account settings.',
    },
  };
}

Deno.serve(async (req: Request) => {
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

  const prefKeyMap: Record<string, string> = {
    new_inquiry: 'inquiries',
    system: 'system',
  };
  const prefKey = prefKeyMap[notification.type];
  if (prefKey && prefs[prefKey] === false) {
    console.info('[send-notification-email] User opted out of', prefKey);
    return new Response('OK', { status: 200 });
  }

  // 3. Build and send the branded email
  const viewUrl = notification.link ? `${APP_URL}${notification.link}` : APP_URL;
  const content = buildEmailContent(notification.type, notification.title, viewUrl);
  const html = renderEmail(content);

  try {
    await sendViaResend({
      apiKey: RESEND_API_KEY,
      from: FROM_ADDRESS,
      to: toEmail,
      subject: content.subject,
      html,
    });
  } catch (err) {
    console.error('[send-notification-email] Resend error', err);
    return new Response('Email send failed', { status: 500 });
  }

  // 4. Mark email_sent_at on the notification row
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
