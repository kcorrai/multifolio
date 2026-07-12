"use client";

// Ücretsiz araç sayfalarının paylaş satırı: Twitter/X + LinkedIn intent + bağlantı
// kopyala. Sunucu ToolCta içinden çağrılır; url mutlak verilir.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, Check } from "lucide-react";

export function ShareButtons({ url, text }: { url: string; text: string }) {
  const t = useTranslations("landing.toolCta");
  const [copied, setCopied] = useState(false);

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard izni yoksa sessiz geç */
    }
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-white/70 hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-400 dark:text-white/40">{t("share")}</span>
      <a href={tweet} target="_blank" rel="noopener noreferrer" className={btn}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        X
      </a>
      <a href={linkedin} target="_blank" rel="noopener noreferrer" className={btn}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" /></svg>
        LinkedIn
      </a>
      <button type="button" onClick={copy} className={btn} aria-label={t("copyLink")}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
