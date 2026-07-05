"use client";

// Public müşteri yorum formu: /p/[slug]/recommend'de gösterilir. Gönderim owner
// onayına düşer (pending). Honeypot (website) + owner başına saatlik limit spam'i azaltır.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RecommendForm({ slug }: { slug: string }) {
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
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-6 text-center space-y-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-5 w-5" />
        </div>
        <p className="font-bold">{t("successTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("successBody")}</p>
      </div>
    );
  }

  const label = "text-xs font-semibold text-muted-foreground";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={label} htmlFor="rec-name">{t("nameLabel")}</label>
          <Input id="rec-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} required />
        </div>
        <div className="space-y-1.5">
          <label className={label} htmlFor="rec-role">{t("roleLabel")}</label>
          <Input id="rec-role" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} maxLength={80} placeholder={t("rolePlaceholder")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={label} htmlFor="rec-quote">{t("quoteLabel")}</label>
        <textarea
          id="rec-quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} maxLength={600} required
          placeholder={t("quotePlaceholder")}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 resize-y"
        />
      </div>
      {/* Honeypot — gizli; botlar doldurur, gerçek kullanıcı görmez. */}
      <input
        type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
        name="website" tabIndex={-1} autoComplete="off" aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      {status === "error" && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!canSubmit || status === "sending"} className="w-full gap-2 font-semibold bg-violet-600 hover:bg-violet-500 text-white">
        <Send className="h-4 w-4" />{status === "sending" ? t("sending") : t("submit")}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground/70">{t("moderationNote")}</p>
    </form>
  );
}
