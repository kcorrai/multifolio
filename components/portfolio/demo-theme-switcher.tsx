"use client";

/* YALNIZ /p/demo — vitrin tema değiştirici.
 *
 * Neden sadece demo: yayınlanmış bir portfolyonun görünümü SAHİBİNİN tasarım
 * kararıdır; ziyaretçi onu değiştirememeli (site geneli açık/koyu tercihi de bu
 * sayfaya bilerek uygulanmaz). Demo ise bir vitrin — ziyaretçinin preset'leri
 * (ve dolayısıyla koyu modu) görebilmesi ürünü satan şeyin ta kendisi.
 *
 * Uygulama: preset artık YALNIZ renk/font değil DÜZEN de değiştiriyor (ölçü,
 * bölüm aralığı, hero hizası, galeri kolonu — bkz. lib/portfolio/theme). Bunlar
 * sunucuda hesaplandığı için değiştirici CSS değişkenlerini yamamak yerine
 * `?preset=` ile SUNUCUYA gider: ziyaretçi preset'in gerçek ritmini görür,
 * yarısı değişmiş bir sayfa değil. */

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";
import { PORTFOLIO_PRESETS, type PortfolioPreset } from "@/lib/portfolio/theme";

export function DemoThemeSwitcher({ initialPreset = "studio" }: { initialPreset?: PortfolioPreset }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = (searchParams.get("preset") as PortfolioPreset) ?? initialPreset;
  const t = useTranslations("portfolioPublic");
  const tp = useTranslations("portfolio.preset");

  function apply(next: PortfolioPreset) {
    router.replace(`/p/demo?preset=${next}`, { scroll: false });
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2 py-1.5 shadow-lg"
      role="group"
      aria-label={t("demoThemeLabel")}
    >
      <div className="flex items-center gap-1">
        <Palette aria-hidden className="mx-1.5 h-3.5 w-3.5 text-[var(--pf-muted)]" />
        {PORTFOLIO_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => apply(p)}
            aria-pressed={preset === p}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              preset === p
                ? "bg-[var(--pf-accent)] text-white"
                : "text-[var(--pf-muted)] hover:text-[var(--pf-text)]"
            }`}
          >
            {tp(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
