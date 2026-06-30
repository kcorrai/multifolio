import "server-only";

const SCORE_THRESHOLD = 70;

export async function sendMatchNotificationEmail(
  to: string,
  jobTitle: string,
  score: number,
  summary: string,
): Promise<void> {
  if (score < SCORE_THRESHOLD) return;

  const apiKey = process.env.RESEND_SMTP_PASS;
  const from = process.env.RESEND_FROM_EMAIL ?? "Multifolio <onboarding@resend.dev>";
  if (!apiKey) return;

  const html = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <div style="background:#090A0F;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="font-size:22px;font-weight:800;color:#00F0FF;letter-spacing:-0.5px">Multifolio</span>
      </div>
      <div style="background:#f9f9f9;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Yeni yüksek eşleşme</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700">${jobTitle}</h2>
        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <span style="font-size:32px;font-weight:800;color:#16a34a">${score}</span>
          <span style="font-size:16px;color:#6b7280">/100</span>
          <p style="margin:8px 0 0;font-size:13px;color:#6b7280;line-height:1.5">${summary}</p>
        </div>
        <a href="https://multifolio-ecru.vercel.app/dashboard"
           style="display:inline-block;background:#00F0FF;color:#090A0F;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
          Dashboard&apos;a Git →
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
        subject: `🎯 Yüksek eşleşme: ${jobTitle} — ${score}/100`,
        html,
      }),
    });
  } catch {
    // fire-and-forget; hata sessizce yutulur
  }
}
