/**
 * Branded HTML email layout for Edge-Function-sent transactional emails.
 * Visually mirrors the Supabase Auth templates in docs/email-templates/.
 */

export interface EmailContent {
  /** Email subject line. */
  subject: string;
  /** Headline shown in the email. */
  title: { ar: string; en: string };
  /** Body paragraph(s). Supports inline HTML (use sparingly). */
  body: { ar: string; en: string };
  /** Optional CTA button. Omit for plain notifications. */
  cta?: { url: string; label: { ar: string; en: string } };
  /** Footer note shown below the body. */
  footer: { ar: string; en: string };
}

/**
 * Returns a complete HTML document for the given content.
 * Inline CSS only; tested in Gmail, Outlook, Apple Mail.
 */
export function renderEmail(content: EmailContent): string {
  const ctaBlock = content.cta
    ? `<tr><td align="center" style="padding:8px 32px 24px;">
         <a href="${escape(content.cta.url)}"
            style="display:inline-block;padding:14px 28px;background-color:#c89b3c;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">
           ${escape(content.cta.label.ar)} &middot; ${escape(content.cta.label.en)}
         </a>
       </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 8px;">
          <div style="font-size:24px;font-weight:700;color:#c89b3c;letter-spacing:1px;">Syria 14</div>
        </td></tr>
        <tr><td dir="rtl" style="padding:24px 32px 8px;text-align:right;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:30px;color:#0f172a;">${escape(content.title.ar)}</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#334155;">${escape(content.body.ar)}</p>
        </td></tr>
        ${ctaBlock}
        <tr><td style="padding:0 32px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
        <tr><td dir="ltr" style="padding:24px 32px 8px;text-align:left;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:30px;color:#0f172a;">${escape(content.title.en)}</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#334155;">${escape(content.body.en)}</p>
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;" align="center">
          <p style="margin:0;font-size:12px;line-height:18px;color:#64748b;">${escape(content.footer.ar)}</p>
          <p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#64748b;">${escape(content.footer.en)}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">© Syria14 — syria14.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Helper to send a rendered email via Resend's HTTP API.
 * Returns the Resend response or throws on non-2xx.
 */
export async function sendViaResend(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<unknown> {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Resend ${resp.status}: ${body}`);
  }
  return resp.json();
}
