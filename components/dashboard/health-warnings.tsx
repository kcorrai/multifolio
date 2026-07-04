"use client";

// Hesap sağlığı uyarısı: üretilen metni (uyarlama/teklif) tarayıp platform kural
// ihlali sinyallerini amber panelde gösterir. Saf tarama lib/health/scan.ts'te;
// bu bileşen yalnız sunum. Bulgu yoksa hiçbir şey render etmez (gürültü yok).
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { scanContent } from "@/lib/health/scan";
import type { PlatformId } from "@/lib/ai/platforms";

export function HealthWarnings({ text, platform }: { text: string; platform: PlatformId }) {
  const t = useTranslations("health");
  const findings = scanContent(text, platform);
  if (findings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-3.5 py-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {t("title")}
      </p>
      <ul className="space-y-1.5">
        {findings.map((f) => (
          <li key={f.type} className="flex items-start gap-2 text-[11px] text-amber-700/90 dark:text-amber-200/90">
            <span
              className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                f.severity === "high" ? "bg-amber-500" : "bg-amber-400/60"
              }`}
            />
            <span className="leading-relaxed">
              {t(`items.${f.type}`)}
              {f.match && (
                <code className="ml-1 rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 font-mono text-[10px] break-all">
                  {f.match}
                </code>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-amber-600/70 dark:text-amber-300/60">{t("footnote")}</p>
    </div>
  );
}
