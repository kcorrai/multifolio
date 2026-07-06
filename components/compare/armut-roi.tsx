"use client";

// Armut "teklif ver / geç" ROI hesaplayıcı: teklif ücreti + proje değeri + kazanma
// olasılığı → beklenen değer + break-even eşiği + karar. Tamamen istemcide (lib/armut/roi.ts),
// AI/API/kredi yok. Armut'un "kaybettiğin lead'e de ödeme" acısına doğrudan yanıt.
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TicketPercent, Check, X, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { computeArmutRoi } from "@/lib/armut/roi";
import { parseLocaleNumber } from "@/lib/format/parse-number";

export function ArmutRoi() {
  const t = useTranslations("compare.armutRoi");
  const locale = useLocale();
  // Locale-farkında ayrıştırma: TR "50.000"→50000, EN "10.5"→10.5.
  const numOr = useCallback((v: string, fallback = 0) => parseLocaleNumber(v, locale, fallback), [locale]);

  const [leadFee, setLeadFee] = useState("190");
  const [projectValue, setProjectValue] = useState("2500");
  const [winProb, setWinProb] = useState("25");

  const result = useMemo(() => computeArmutRoi({
    leadFee: numOr(leadFee),
    projectValue: numOr(projectValue),
    winProbPct: numOr(winProb),
  }), [leadFee, projectValue, winProb, numOr]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }),
    [locale],
  );

  const labelCls = "text-xs font-semibold text-muted-foreground";
  const inputCls = "h-9 text-sm";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20 p-5 space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
          <TicketPercent className="h-4 w-4 shrink-0" />{t("title")}
        </p>
        <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80 leading-relaxed">{t("subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="armut-fee">{t("leadFee")}</label>
          <Input id="armut-fee" inputMode="decimal" value={leadFee} onChange={(e) => setLeadFee(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="armut-value">{t("projectValue")}</label>
          <Input id="armut-value" inputMode="decimal" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="armut-prob">{t("winProb")}</label>
          <Input id="armut-prob" inputMode="decimal" value={winProb} onChange={(e) => setWinProb(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${result.worthBidding
        ? "border-emerald-300/50 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
        : "border-red-300/50 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"}`}>
        <p className={`flex items-center gap-2 text-sm font-bold ${result.worthBidding ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${result.worthBidding ? "bg-emerald-500" : "bg-red-500"} text-white`}>
            {result.worthBidding ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          {result.worthBidding ? t("verdictWorth") : t("verdictSkip")}
        </p>
        <div className="mt-2 space-y-1 text-xs tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("expectedValue")}</span>
            <span className={`font-bold ${result.expectedValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {result.expectedValue >= 0 ? "+" : ""}{fmt.format(result.expectedValue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("breakEven")}</span>
            <span className="font-semibold">{t("breakEvenValue", { pct: result.breakEvenProbPct })}</span>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />{t("disclaimer")}
      </p>
    </div>
  );
}
