"use client";

/* YALNIZ /p/demo — vitrin tema değiştirici.
 *
 * Neden sadece demo: yayınlanmış bir portfolyonun görünümü SAHİBİNİN tasarım
 * kararıdır; ziyaretçi onu değiştirememeli (site geneli açık/koyu tercihi de bu
 * sayfaya bilerek uygulanmaz). Demo ise bir vitrin — ziyaretçinin preset'leri
 * (ve dolayısıyla koyu modu) görebilmesi ürünü satan şeyin ta kendisi.
 *
 * Uygulama: sunucu kökteki inline CSS değişkenlerini basar; burada aynı elemanın
 * (#pf-root) style'ına setProperty ile yazarak override ediyoruz — sayfayı client
 * bileşene çevirmeye ya da yeniden render etmeye gerek yok. portfolioTheme SAF
 * olduğu için istemcide de aynı sonucu üretir (tek doğruluk kaynağı korunur). */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";
import { PORTFOLIO_PRESETS, portfolioTheme, type PortfolioPreset, type PortfolioAccent } from "@/lib/portfolio/theme";

export function DemoThemeSwitcher({
  initialPreset = "studio",
  accent = "blue",
}: {
  initialPreset?: PortfolioPreset;
  accent?: PortfolioAccent;
}) {
  const [preset, setPreset] = useState<PortfolioPreset>(initialPreset);
  const t = useTranslations("portfolioPublic");
  const tp = useTranslations("portfolio.preset");

  function apply(next: PortfolioPreset) {
    const root = document.getElementById("pf-root");
    if (!root) return;
    const { vars } = portfolioTheme(next, accent);
    for (const [key, value] of Object.entries(vars)) {
      if (key.startsWith("--")) root.style.setProperty(key, String(value));
    }
    setPreset(next);
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
