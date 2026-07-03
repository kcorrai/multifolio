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
