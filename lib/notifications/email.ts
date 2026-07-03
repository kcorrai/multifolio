import "server-only";
import type { Locale } from "@/i18n/detect";

const SCORE_THRESHOLD = 70;

// HTML-escape: jobTitle/summary kullanıcı+AI kaynaklı; e-posta gövdesine ham
// gömülmeleri HTML injection olur (alıcı hesap sahibi olsa da savunma şart).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Server-only: i18n context'i yok → inline iki dilli metin sözlüğü.
const COPY = {
  en: {
    eyebrow: "New high match",
    cta: "Go to dashboard →",
    subject: (jobTitle: string, score: number) => `🎯 High match: ${jobTitle} — ${score}/100`,
  },
  tr: {
    eyebrow: "Yeni yüksek eşleşme",
    cta: "Dashboard'a Git →",
    subject: (jobTitle: string, score: number) => `🎯 Yüksek eşleşme: ${jobTitle} — ${score}/100`,
  },
} as const;

export async function sendMatchNotificationEmail(
  to: string,
  jobTitle: string,
  score: number,
  summary: string,
  locale: Locale = "en",
): Promise<void> {
  if (score < SCORE_THRESHOLD) return;

  const apiKey = process.env.RESEND_SMTP_PASS;
  const from = process.env.RESEND_FROM_EMAIL ?? "Multifolio <onboarding@resend.dev>";
  if (!apiKey) return;

  const copy = COPY[locale];
  const safeTitle = escapeHtml(jobTitle);
  const safeSummary = escapeHtml(summary);

  const html = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <div style="background:#090A0F;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="font-size:22px;font-weight:800;color:#00F0FF;letter-spacing:-0.5px">Multifolio</span>
      </div>
      <div style="background:#f9f9f9;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280">${copy.eyebrow}</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700">${safeTitle}</h2>
        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <span style="font-size:32px;font-weight:800;color:#16a34a">${score}</span>
          <span style="font-size:16px;color:#6b7280">/100</span>
          <p style="margin:8px 0 0;font-size:13px;color:#6b7280;line-height:1.5">${safeSummary}</p>
        </div>
        <a href="https://multifolio-ecru.vercel.app/dashboard"
           style="display:inline-block;background:#00F0FF;color:#090A0F;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
          ${copy.cta}
        </a>
      </div>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: copy.subject(jobTitle, score),
        html,
      }),
    });
  } catch {
    // fire-and-forget; hata sessizce yutulur
  }
}

// E-postada listelenen ilan tavanı; kalanı "+N more" satırı olur.
const DIGEST_MAX_JOBS = 6;

/** Feed özet e-postası: cron koşusunda kullanıcının bildirimli feed'leriyle
 *  eşleşen yeni ilanlar. Cron bağlamında UI locale bilinmez → ürün varsayılanı EN. */
export async function sendFeedDigestEmail(
  to: string,
  feedNames: string[],
  jobs: { title: string; budget: string | null; source: string; url: string | null }[],
): Promise<void> {
  const apiKey = process.env.RESEND_SMTP_PASS;
  const from = process.env.RESEND_FROM_EMAIL ?? "Multifolio <onboarding@resend.dev>";
  if (!apiKey || jobs.length === 0) return;

  const safeFeeds = escapeHtml(feedNames.join(", "));
  const shown = jobs.slice(0, DIGEST_MAX_JOBS);
  const rest = jobs.length - shown.length;

  const rows = shown.map((j) => {
    const meta = [j.budget, j.source].filter(Boolean).join(" · ");
    const title = escapeHtml(j.title);
    const link = j.url
      ? `<a href="${escapeHtml(j.url)}" style="color:#1a1a1a;text-decoration:none">${title}</a>`
      : title;
    return `
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:12px 16px;margin-bottom:8px">
        <p style="margin:0;font-size:14px;font-weight:700">${link}</p>
        ${meta ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280">${escapeHtml(meta)}</p>` : ""}
      </div>`;
  }).join("");

  const html = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <div style="background:#090A0F;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="font-size:22px;font-weight:800;color:#00F0FF;letter-spacing:-0.5px">Multifolio</span>
      </div>
      <div style="background:#f9f9f9;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280">New matches for your feeds</p>
        <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">${safeFeeds}</h2>
        ${rows}
        ${rest > 0 ? `<p style="margin:4px 0 16px;font-size:13px;color:#6b7280">+${rest} more matching job${rest === 1 ? "" : "s"}</p>` : ""}
        <a href="https://multifolio-ecru.vercel.app/dashboard/jobs?view=feed"
           style="display:inline-block;background:#00F0FF;color:#090A0F;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px">
          Open your feed →
        </a>
      </div>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `🔔 ${jobs.length} new job${jobs.length === 1 ? "" : "s"} match your feeds`,
        html,
      }),
    });
  } catch {
    // fire-and-forget; hata sessizce yutulur
  }
}
