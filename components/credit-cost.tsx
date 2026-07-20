"use client";

// Kredi harcayan butonların üzerindeki maliyet rozeti ("1 kredi", "2 kredi").
// current-color border kullanır — hangi buton varyantında olursa olsun uyum sağlar.
import { useTranslations } from "next-intl";
import { CREDIT_COSTS, type CreditKind } from "@/lib/credits/costs";

/** `times`: aksiyonun kaç kez çalışacağı (toplu işlemler). Rozet TOPLAM maliyeti
 *  gösterir — tek birim fiyatı gösterip N kat harcamak kullanıcıyı yanıltır. */
export function CreditCost({ kind, times = 1 }: { kind: CreditKind; times?: number }) {
  const t = useTranslations("credits");
  return (
    <span className="ml-0.5 inline-flex items-center rounded-full border border-current/30 px-1.5 py-px text-[11px] font-bold tabular-nums opacity-90">
      {t("cost", { count: CREDIT_COSTS[kind] * Math.max(1, times) })}
    </span>
  );
}
