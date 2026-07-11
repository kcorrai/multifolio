"use client";

// Ücret hesaplayıcı formu: tamamen istemcide, canlı hesap (AI/API yok).
// "Ne ücret istemeliyim?" — istenen net gelirden geriye doğru gereken saatlik/
// günlük ücret. Tüm oranlar varsayılanla dolu ve DÜZENLENEBİLİR (sorumluluk notu).
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Tag, Info, ArrowRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  computeSuggestedRate, RATE_PLATFORM_DEFAULTS, RATE_DEFAULTS,
  BILLABLE_HOURS_PRESETS, type RatePlatform,
} from "@/lib/rate/calculator";
import { parseLocaleNumber } from "@/lib/format/parse-number";

const PLATFORM_LABELS: Record<RatePlatform, string> = {
  upwork: "Upwork",
  fiverr: "Fiverr",
  bionluk: "Bionluk",
  direct: "", // i18n'den (platformDirect)
};

const TAX_PRESETS = [0, 15, 20, 27] as const;
type Currency = "USD" | "TRY";

export function RateCalculator({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("rate");
  const locale = useLocale();
  const numOr = useCallback((v: string, fallback = 0) => parseLocaleNumber(v, locale, fallback), [locale]);

  const [platform, setPlatform] = useState<RatePlatform>("upwork");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [targetNet, setTargetNet] = useState(String(RATE_DEFAULTS.targetNetMonthly));
  const [expenses, setExpenses] = useState(String(RATE_DEFAULTS.monthlyExpenses));
  const [hours, setHours] = useState(String(RATE_DEFAULTS.billableHoursPerWeek));
  const [weeksOff, setWeeksOff] = useState(String(RATE_DEFAULTS.weeksOffPerYear));
  const [taxPct, setTaxPct] = useState(String(RATE_DEFAULTS.taxPct));
  const [platformFee, setPlatformFee] = useState(String(RATE_DEFAULTS.platformFeePct));

  function pickPlatform(p: RatePlatform) {
    setPlatform(p);
    setPlatformFee(String(RATE_PLATFORM_DEFAULTS[p]));
    if (p === "bionluk") setCurrency("TRY");
    else if (p !== "direct") setCurrency("USD");
  }

  const result = useMemo(() => computeSuggestedRate({
    targetNetMonthly: numOr(targetNet),
    monthlyExpenses: numOr(expenses),
    billableHoursPerWeek: numOr(hours),
    weeksOffPerYear: numOr(weeksOff),
    taxPct: numOr(taxPct),
    platformFeePct: numOr(platformFee),
  }), [targetNet, expenses, hours, weeksOff, taxPct, platformFee, numOr]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );
  const fmt2 = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }),
    [locale, currency],
  );

  const inputCls = "h-9 text-sm";
  const labelCls = "text-xs font-semibold text-muted-foreground";
  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      active
        ? "border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]"
        : "border-border text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Girdi formu */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* İstenen net + para birimi */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls} htmlFor="rate-net">{t("targetNet")}</label>
            <Input id="rate-net" inputMode="decimal" value={targetNet} onChange={(e) => setTargetNet(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <p className={labelCls}>{t("currency")}</p>
            <div className="flex gap-2">
              {(["USD", "TRY"] as Currency[]).map((c) => (
                <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)} className={chipCls(currency === c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Gider */}
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="rate-exp">{t("expenses")}</label>
          <Input id="rate-exp" inputMode="decimal" value={expenses} onChange={(e) => setExpenses(e.target.value)} className={inputCls} />
          <p className="text-[11px] text-muted-foreground/70">{t("expensesHint")}</p>
        </div>

        {/* Faturalanabilir saat/hafta */}
        <div className="space-y-2">
          <label className={labelCls} htmlFor="rate-hours">{t("billableHours")}</label>
          <div className="flex flex-wrap items-center gap-2">
            {BILLABLE_HOURS_PRESETS.map((h) => (
              <button key={h} type="button" aria-pressed={numOr(hours) === h} onClick={() => setHours(String(h))} className={chipCls(numOr(hours) === h)}>{h}</button>
            ))}
            <Input id="rate-hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <p className="text-[11px] text-muted-foreground/70">{t("billableHint")}</p>
        </div>

        {/* İzin haftası */}
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="rate-off">{t("weeksOff")}</label>
          <Input id="rate-off" inputMode="decimal" value={weeksOff} onChange={(e) => setWeeksOff(e.target.value)} className={`${inputCls} w-24`} />
        </div>

        {/* Platform komisyonu */}
        <div className="space-y-2">
          <p className={labelCls}>{t("platform")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RATE_PLATFORM_DEFAULTS) as RatePlatform[]).map((p) => (
              <button key={p} type="button" aria-pressed={platform === p} onClick={() => pickPlatform(p)} className={chipCls(platform === p)}>
                {p === "direct" ? t("platformDirect") : PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className={labelCls} htmlFor="rate-fee">{t("platformFee")}</label>
            <Input id="rate-fee" inputMode="decimal" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} className={`${inputCls} w-24`} />
          </div>
        </div>

        {/* Vergi */}
        <div className="space-y-2">
          <label className={labelCls} htmlFor="rate-tax">{t("tax")}</label>
          <div className="flex flex-wrap items-center gap-2">
            {TAX_PRESETS.map((p) => (
              <button key={p} type="button" aria-pressed={numOr(taxPct) === p} onClick={() => setTaxPct(String(p))} className={chipCls(numOr(taxPct) === p)}>%{p}</button>
            ))}
            <Input id="rate-tax" inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <p className="text-[11px] text-muted-foreground/70">{t("taxHint")}</p>
        </div>
      </div>

      {/* Sonuç */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00F0FF] flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />{t("resultTitle")}
          </p>

          {result.feasible ? (
            <>
              <div>
                <p className="text-3xl font-extrabold tabular-nums">
                  {fmt2.format(result.requiredHourlyRate)}<span className="text-sm font-semibold text-muted-foreground">/{t("perHour")}</span>
                </p>
                <p className="text-sm font-semibold text-muted-foreground tabular-nums mt-0.5">
                  ≈ {fmt.format(result.requiredDayRate)}/{t("perDay")}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#00F0FF]/15 text-xs tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("rows.monthlyGross")}</span>
                  <span className="font-semibold">{fmt.format(result.requiredMonthlyGross)}</span>
                </div>
                {[
                  { label: t("rows.platformFee"), value: result.platformFee },
                  { label: t("rows.tax"), value: result.tax },
                  { label: t("rows.expenses"), value: result.expenses },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-red-600 dark:text-red-400">−{fmt.format(value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 border-t border-[#00F0FF]/15">
                  <span className="font-semibold">{t("rows.net")}</span>
                  <span className="font-bold text-[#00F0FF]">{fmt.format(result.net)}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                {t("hoursNote", { monthly: Math.round(result.monthlyBillableHours), weeks: result.workingWeeks })}
              </p>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {t("infeasible")}
            </p>
          )}
        </div>

        <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {t("disclaimer")}
        </p>

        {/* Bağlamsal signup köprüsü (analyze/earnings deseni) — yalnız kayıtsıza. */}
        {!isLoggedIn && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2">
            <p className="text-sm font-semibold">{t("ctaTitle")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("ctaBody")}</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 transition-colors"
            >
              {t("ctaButton")}<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
