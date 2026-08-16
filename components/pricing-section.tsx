// Kredi paketleri (pay-as-you-go) — Solar Pop tasarımı. Landing + /pricing paylaşır.
// İŞLEV DEĞİŞMEDİ: paket listesi, locale'e göre para birimi, iyzico "canlı mı"
// kontrolü ve BuyCreditsButton akışı aynen korunur — yalnız sunum yenilendi.
// Referans komp: docs/design/solar-pop/multifolio-landing-solar-pop.html (priceCards)
import Link from "next/link";
import { Sun } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { SectionHeading } from "@/components/solar/site-chrome";
import { isIyzicoConfigured } from "@/lib/payments/iyzico";
import { CREDIT_COSTS } from "@/lib/credits/costs";

const plans = [
  { key: "starter", credits: 100,  usd: "$9",  try: "₺349",   featured: false },
  { key: "pro",     credits: 500,  usd: "$29", try: "₺1.149", featured: true  },
  { key: "scale",   credits: 1500, usd: "$69", try: "₺2.749", featured: false },
] as const;

/** showHeader=false: /pricing kendi hero'suna sahip → bölüm başlığını tekrarlama. */
export async function PricingSection({ isLoggedIn = false, showHeader = true }: { isLoggedIn?: boolean; showHeader?: boolean }) {
  const t = await getTranslations("landing");
  const ts = await getTranslations("landing.sp.pricing");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const currency: "usd" | "try" = locale === "tr" ? "try" : "usd";
  const paymentsEnabled = isIyzicoConfigured();

  return (
    <section id="pricing" className="sp-section">
      <div className="sp-wrap grid gap-7">
        {showHeader ? <SectionHeading eyebrow={t("pricing.eyebrow")} title={ts("title")} script={ts("script")} /> : null}

        <div className="sp-grid-3 items-stretch">
          {plans.map((plan) => {
            const { key, credits, featured } = plan;
            const price = plan[currency];
            // Ödeme canlı DEĞİLSE hiçbir paket satın alınamaz; ücretsiz 100 kredi
            // yine de gerçek → "canlı" rozetini ona değil, satın alınabilirliğe bağla.
            const live = paymentsEnabled;

            return (
              <div
                key={key}
                className="grid content-start gap-4 rounded-[var(--radius-sp-lg)] p-[26px]"
                style={{
                  background: featured ? "var(--surface-inverse)" : "var(--surface-card)",
                  boxShadow: featured ? "var(--shadow-lift)" : "none",
                }}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <h3
                    style={{
                      font: "var(--fw-black) var(--fs-title)/1 var(--font-display)",
                      letterSpacing: "var(--tracking-display)", textTransform: "uppercase",
                      color: featured ? "var(--white)" : "var(--text-strong)",
                    }}
                  >
                    {t(`pricing.plans.${key}`)}
                  </h3>
                  <span
                    className="sp-label whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-1.5"
                    style={{
                      background: featured ? "rgba(255,255,255,.22)" : "var(--surface-muted)",
                      color: featured ? "var(--white)" : "var(--text-muted)",
                    }}
                  >
                    {live ? ts("badgeLive") : ts("badgeSoon")}
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <span
                    className="tabular-nums"
                    style={{
                      font: "var(--fw-black) var(--fs-display-m)/1 var(--font-display)",
                      letterSpacing: "var(--tracking-display)",
                      color: featured ? "var(--white)" : "var(--text-heading)",
                    }}
                  >
                    {price}
                  </span>
                  <span
                    style={{
                      font: "var(--fw-bold) var(--fs-body-s)/1 var(--font-display)",
                      textTransform: "uppercase", letterSpacing: ".05em",
                      color: featured ? "rgba(255,255,255,.8)" : "var(--text-muted)",
                    }}
                  >
                    {t("pricing.creditsLine", { count: credits })}
                  </span>
                </div>

                <p className="sp-body" style={featured ? { color: "rgba(255,255,255,.9)" } : undefined}>
                  {t(`pricing.desc.${key}`)}
                </p>

                <div className="grid gap-2.5">
                  {[
                    t("pricing.valueHint", {
                      adaptations: Math.floor(credits / CREDIT_COSTS.adaptation),
                      proposals: Math.floor(credits / CREDIT_COSTS.proposal),
                    }),
                    ts("neverExpire"),
                    ts("noRenew"),
                  ].map((item) => (
                    <span
                      key={item}
                      className="grid gap-2.5"
                      style={{
                        gridTemplateColumns: "18px 1fr",
                        font: "var(--fw-regular) var(--fs-body-s)/1.5 var(--font-body)",
                        color: featured ? "rgba(255,255,255,.92)" : "var(--text-body)",
                      }}
                    >
                      <span
                        className="mt-[5px] h-[7px] w-[7px] rounded-[var(--radius-pill)]"
                        style={{ background: featured ? "var(--white)" : "var(--pink-400)" }}
                      />
                      {item}
                    </span>
                  ))}
                </div>

                {paymentsEnabled && isLoggedIn ? (
                  <BuyCreditsButton
                    packageId={key}
                    label={t("pricing.buy")}
                    className={`sp-btn sp-btn--block ${featured ? "sp-btn--quiet" : "sp-btn--ghost"}`}
                  />
                ) : (
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/signup"}
                    className={`sp-btn sp-btn--block ${featured ? "sp-btn--quiet" : "sp-btn--ghost"}`}
                  >
                    {isLoggedIn ? tc("goToDashboard") : t("pricing.cta")}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Ödeme henüz açılmadıysa bunu gizlemek yerine dürüstçe söyle. */}
        {!paymentsEnabled ? (
          <div
            className="flex flex-wrap items-center gap-3.5 rounded-[var(--radius-sp-lg)] px-6 py-5"
            style={{ background: "var(--amber-200)" }}
          >
            <span
              className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--radius-pill)]"
              style={{ background: "var(--white)", color: "var(--flame-500)" }}
            >
              <Sun size={16} />
            </span>
            <span className="sp-sub" style={{ fontSize: "var(--fs-body)" }}>{ts("soonTitle")}</span>
            <span className="sp-body">{t("pricing.paymentSoon")}</span>
          </div>
        ) : null}

        {/* Anti-Connects konumlandırma: kredi = ürettiğin ve senin olan iş. */}
        <p className="sp-body sp-body--lead" style={{ maxWidth: "62ch" }}>{t("pricing.antiConnects")}</p>

        {currency === "try" ? (
          <p className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("pricing.tryApprox")}</p>
        ) : null}
      </div>
    </section>
  );
}
