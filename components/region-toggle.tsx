"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setUserMarket } from "@/i18n/actions";
import type { MarketId } from "@/lib/markets/config";

// Bölge (pazar) seçici. Kullanıcı dil DEĞİL bölge seçer; UI dili pazardan türer.
// Mevcut pazar UI locale'inden çıkarılır (tr → TR pazarı, en → Global) — in-market dil
// değişimi olmadığı için bu eşleme kesin. İki pazar olduğundan tek tıkla diğerine geçer.
export function RegionToggle() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const current: MarketId = locale === "tr" ? "tr" : "global";
  const next: MarketId = current === "tr" ? "global" : "tr";
  const label = current === "tr" ? t("regionTr") : t("regionGlobal");

  function switchRegion() {
    startTransition(async () => {
      await setUserMarket(next);
      router.refresh();
    });
  }

  return (
    <button
      onClick={switchRegion}
      disabled={pending}
      aria-label={t("switchRegion")}
      title={t("switchRegion")}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
    >
      <Globe className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
