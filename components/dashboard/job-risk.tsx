"use client";

// Gelen ilan dolandırıcılık uyarısı: ilan metnini scanJobListing ile tarar (SAF,
// lib/feed/scam.ts), sinyal varsa uyarır. Bulgu yoksa hiçbir şey render etmez.
// İki sunum: kompakt rozet (feed satırı) + tam panel (ilan detayı) — HealthWarnings deseni.
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { scanJobListing } from "@/lib/feed/scam";

// Feed satırında: sinyal varsa küçük kırmızı "olası dolandırıcılık" çipi.
export function JobScamBadge({ text }: { text: string }) {
  const t = useTranslations("feed.scam");
  const findings = scanJobListing(text);
  if (findings.length === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300"
      title={t("badge")}
    >
      <ShieldAlert className="h-3 w-3" />
      {t("badge")}
    </span>
  );
}

// İlan detay panelinde: bulguları listeleyen kırmızı uyarı paneli.
export function JobScamWarning({ text }: { text: string }) {
  const t = useTranslations("feed.scam");
  const findings = scanJobListing(text);
  if (findings.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 px-3.5 py-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        {t("title")}
      </p>
      <ul className="space-y-1.5">
        {findings.map((f) => (
          <li key={f.type} className="flex items-start gap-2 text-xs text-red-700/90 dark:text-red-200/90">
            <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-red-500" />
            <span className="leading-relaxed">
              {t(`items.${f.type}`)}
              {f.match && (
                <code className="ml-1 rounded bg-red-100 dark:bg-red-900/40 px-1 py-0.5 font-mono text-[11px] break-all">
                  {f.match}
                </code>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-red-600/70 dark:text-red-300/60">{t("footnote")}</p>
    </div>
  );
}
