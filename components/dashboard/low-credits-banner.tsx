"use client";

// Düşük kredi uyarısı: bakiye eşiğin altına düşünce dashboard içeriğinin
// üstünde amber banner (verify-email-banner deseni). Satın alma canlı olana
// dek CTA "yakında" toast'ını tetikler. Dismiss oturum-içi (layout persist
// ettiği için sekme geçişlerinde kapalı kalır).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coins, X } from "lucide-react";
import { useDashboard } from "./dashboard-context";

// Eşik: yeni kullanıcı 100 kredi ile başlar; 20'nin altı "azalıyor" sayılır.
const LOW_CREDITS_THRESHOLD = 20;

export function LowCreditsBanner() {
  const t = useTranslations("dashboard.lowCredits");
  const { credits, creditsUsed, triggerComingSoon } = useDashboard();
  const [dismissed, setDismissed] = useState(false);

  // creditsUsed > 0 guard'ı: hiç harcamamış ama düşük bakiyeli uç durumda susar.
  if (dismissed || creditsUsed === 0 || credits >= LOW_CREDITS_THRESHOLD) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
      <Coins className="h-5 w-5 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t("title")}</p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/60">{t("body", { credits })}</p>
      </div>
      <button
        onClick={triggerComingSoon}
        className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
      >
        {t("cta")}
      </button>
      <button
        onClick={() => setDismissed(true)}
        title={t("dismiss")}
        aria-label={t("dismiss")}
        className="shrink-0 text-amber-600/60 hover:text-amber-700 dark:text-amber-400/60 dark:hover:text-amber-300 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
