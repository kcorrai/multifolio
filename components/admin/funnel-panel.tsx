// /admin aktivasyon hunisi paneli (sunucu bileşeni — yalnız RENDER eder).
//
// Veri kendi veritabanından: `product_events` (sunucu rotalarının yazdığı ürün
// olayları) + `auth.users` (kayıt kohortu). Üçüncü taraf analitik YOK, istemci
// scripti YOK, çerez YOK. Hesap saf `lib/analytics/funnel.ts`'te (vitest'li),
// yükleme `lib/analytics/funnel-server.ts`'te.
import { getTranslations } from "next-intl/server";
import { TrendingDown } from "lucide-react";
import { loadFunnel, FUNNEL_WINDOW_DAYS, FUNNEL_USER_CAP } from "@/lib/analytics/funnel-server";

export async function FunnelPanel() {
  const t = await getTranslations("admin.funnel");
  const { steps, worst, cohortSize, truncated } = await loadFunnel();

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">{t("window", { days: FUNNEL_WINDOW_DAYS })}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("desc")}</p>

      {cohortSize === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {steps.map((step, i) => (
            <div key={step.key} className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{t(`step.${step.key}`)}</span>
                <span className="text-sm tabular-nums">
                  {/* Yüzde tek sinyal değil — mutlak sayı hep yanında. */}
                  <strong>{step.users}</strong>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("ofTotal", { pct: step.ofTotalPct })}
                    {i > 0 ? ` · ${t("ofPrevious", { pct: step.ofPreviousPct })}` : ""}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[#FA531C]" style={{ width: `${step.ofTotalPct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {worst ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#FA531C]/40 bg-[#FA531C]/5 p-3 text-sm">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-[#FA531C]" />
          <span>
            {t("biggestDrop", {
              from: t(`step.${worst.from}`),
              to: t(`step.${worst.to}`),
              lost: worst.lost,
            })}
          </span>
        </p>
      ) : null}

      {truncated ? <p className="mt-2 text-xs text-muted-foreground">{t("truncated", { cap: FUNNEL_USER_CAP })}</p> : null}
    </section>
  );
}
