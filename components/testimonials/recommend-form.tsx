"use client";

// Public müşteri yorum formu: /p/[slug]/recommend'de gösterilir. Gönderim owner
// onayına düşer (pending). Honeypot (website) + owner başına saatlik limit spam'i azaltır.
// Stil PORTFOLYO tema tokenlarıyla (--pf-*) → sayfayla görsel tutarlı (app token'ı yok).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Check } from "lucide-react";

export function RecommendForm({ slug, accentHex = "#2563EB" }: { slug: string; accentHex?: string }) {
  const t = useTranslations("recommend");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [quote, setQuote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const canSubmit = authorName.trim().length >= 2 && quote.trim().length >= 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, authorName, authorRole: authorRole || undefined, quote, website: website || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? t("error"));
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError(t("error"));
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="rounded-2xl border p-6 text-center space-y-2"
        style={{ background: `${accentHex}12`, borderColor: `${accentHex}40` }}
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: accentHex }}>
          <Check className="h-5 w-5" />
        </div>
        <p className="font-bold">{t("successTitle")}</p>
        <p className="text-sm" style={{ color: "var(--pf-muted)" }}>{t("successBody")}</p>
      </div>
    );
  }

  const labelCls = "text-xs font-semibold";
  const labelStyle = { color: "var(--pf-muted)" };
  // Alanlar portfolyo tema tokenlarıyla + accent odak halkası (app token'ı yok).
  const fieldCls = "w-full rounded-xl border px-3 py-2.5 text-sm leading-relaxed transition placeholder:opacity-50 focus:outline-none focus:ring-2";
  const fieldStyle = {
    background: "var(--pf-bg)",
    borderColor: "var(--pf-border)",
    color: "var(--pf-text)",
    "--tw-ring-color": `${accentHex}55`,
  } as React.CSSProperties;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelCls} style={labelStyle} htmlFor="rec-name">{t("nameLabel")}</label>
          <input id="rec-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} required
            className={fieldCls} style={fieldStyle} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls} style={labelStyle} htmlFor="rec-role">{t("roleLabel")}</label>
          <input id="rec-role" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} maxLength={80}
            placeholder={t("rolePlaceholder")} className={fieldCls} style={fieldStyle} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={labelCls} style={labelStyle} htmlFor="rec-quote">{t("quoteLabel")}</label>
        <textarea
          id="rec-quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} maxLength={600} required
          placeholder={t("quotePlaceholder")}
          className={`${fieldCls} resize-y`} style={fieldStyle}
        />
      </div>
      {/* Honeypot — gizli; botlar doldurur, gerçek kullanıcı görmez. */}
      <input
        type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
        name="website" tabIndex={-1} autoComplete="off" aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      {status === "error" && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit || status === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: accentHex }}
      >
        <Send className="h-4 w-4" />{status === "sending" ? t("sending") : t("submit")}
      </button>
      <p className="text-center text-xs" style={{ color: "var(--pf-muted)" }}>{t("moderationNote")}</p>
    </form>
  );
}
