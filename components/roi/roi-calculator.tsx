"use client";

// Teklif ROI hesaplayıcı formu: tamamen istemcide, canlı hesap (AI/API yok).
// "Connect'lerim geri dönüyor mu?" — teklif harcaması vs kazanılan iş geliri.
// Tüm oranlar varsayılanla dolu ve DÜZENLENEBİLİR (sorumluluk notu).
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp, Info, ArrowRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  computeRoi, ROI_DEFAULTS, CONNECTS_PER_PROPOSAL_PRESETS,
} from "@/lib/roi/calculator";
import { parseLocaleNumber } from "@/lib/format/parse-number";

type Currency = "USD" | "TRY";
const WIN_RATE_PRESETS = [2, 5, 8, 12] as const;

export function RoiCalculator({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("roi");
  const locale = useLocale();
  const numOr = useCallback((v: string, fallback = 0) => parseLocaleNumber(v, locale, fallback), [locale]);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [proposals, setProposals] = useState(String(ROI_DEFAULTS.proposalsSent));
  const [connectsPer, setConnectsPer] = useState(String(ROI_DEFAULTS.connectsPerProposal));
  const [costPer, setCostPer] = useState(String(ROI_DEFAULTS.costPerConnect));
  const [winRate, setWinRate] = useState(String(ROI_DEFAULTS.winRatePct));
  const [projectValue, setProjectValue] = useState(String(ROI_DEFAULTS.avgProjectValue));

  const result = useMemo(() => computeRoi({
    proposalsSent: numOr(proposals),
    connectsPerProposal: numOr(connectsPer),
    costPerConnect: numOr(costPer),
    winRatePct: numOr(winRate),
    avgProjectValue: numOr(projectValue),
  }), [proposals, connectsPer, costPer, winRate, projectValue, numOr]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );
  const fmt2 = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }),
    [locale, currency],
  );
  const numFmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);

  const inputCls = "h-9 text-sm";
  const labelCls = "text-xs font-semibold text-muted-foreground";
  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      active
        ? "border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]"
        : "border-border text-muted-foreground hover:text-foreground"
    }`;

  const profitable = result.feasible && result.netGain >= 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Girdi formu */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* Teklif sayısı + para birimi */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls} htmlFor="roi-proposals">{t("proposalsSent")}</label>
            <Input id="roi-proposals" inputMode="decimal" value={proposals} onChange={(e) => setProposals(e.target.value)} className={inputCls} />
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

        {/* Teklif başına Connect */}
        <div className="space-y-2">
          <label className={labelCls} htmlFor="roi-connects">{t("connectsPerProposal")}</label>
          <div className="flex flex-wrap items-center gap-2">
            {CONNECTS_PER_PROPOSAL_PRESETS.map((c) => (
              <button key={c} type="button" aria-pressed={numOr(connectsPer) === c} onClick={() => setConnectsPer(String(c))} className={chipCls(numOr(connectsPer) === c)}>{c}</button>
            ))}
            <Input id="roi-connects" inputMode="decimal" value={connectsPer} onChange={(e) => setConnectsPer(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <p className="text-xs text-muted-foreground/70">{t("connectsHint")}</p>
        </div>

        {/* Connect maliyeti */}
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="roi-cost">{t("costPerConnect")}</label>
          <Input id="roi-cost" inputMode="decimal" value={costPer} onChange={(e) => setCostPer(e.target.value)} className={`${inputCls} w-28`} />
          <p className="text-xs text-muted-foreground/70">{t("costHint")}</p>
        </div>

        {/* Kazanma oranı */}
        <div className="space-y-2">
          <label className={labelCls} htmlFor="roi-win">{t("winRate")}</label>
          <div className="flex flex-wrap items-center gap-2">
            {WIN_RATE_PRESETS.map((p) => (
              <button key={p} type="button" aria-pressed={numOr(winRate) === p} onClick={() => setWinRate(String(p))} className={chipCls(numOr(winRate) === p)}>%{p}</button>
            ))}
            <Input id="roi-win" inputMode="decimal" value={winRate} onChange={(e) => setWinRate(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <p className="text-xs text-muted-foreground/70">{t("winRateHint")}</p>
        </div>

        {/* Ortalama proje değeri */}
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="roi-value">{t("avgProjectValue")}</label>
          <Input id="roi-value" inputMode="decimal" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} className={`${inputCls} w-32`} />
        </div>
      </div>

      {/* Sonuç */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00F0FF] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />{t("resultTitle")}
          </p>

          {result.feasible ? (
            <>
              <div>
                <p className={`text-3xl font-extrabold tabular-nums ${profitable ? "text-[#00F0FF]" : "text-red-500 dark:text-red-400"}`}>
                  {numFmt.format(result.roiMultiple)}×
                </p>
                <p className="text-sm font-semibold text-muted-foreground tabular-nums mt-0.5">
                  {t("roiMultipleLabel")} · {t("rows.netGain")} {fmt.format(result.netGain)}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#00F0FF]/15 text-xs tabular-nums">
                {[
                  { label: t("rows.connectsSpent"), value: numFmt.format(result.connectsSpent) },
                  { label: t("rows.connectCost"), value: fmt2.format(result.totalConnectCost) },
                  { label: t("rows.wins"), value: numFmt.format(result.wins) },
                  { label: t("rows.revenue"), value: fmt.format(result.revenue) },
                  { label: t("rows.costPerWin"), value: result.wins > 0 ? fmt2.format(result.costPerWin) : "—" },
                  { label: t("rows.revenuePerConnect"), value: fmt2.format(result.revenuePerConnect) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              <p className={`text-xs pt-1 leading-relaxed ${profitable ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {profitable
                  ? t("profit", { multiple: numFmt.format(result.roiMultiple) })
                  : t("loss")}
              </p>
              <p className="text-xs text-muted-foreground pt-0.5">
                {t("breakEven", { rate: numFmt.format(result.breakEvenWinRatePct) })}
              </p>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {t("infeasible")}
            </p>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground/70 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {t("disclaimer")}
        </p>

        {/* Bağlamsal signup köprüsü (rate deseni) — yalnız kayıtsıza. */}
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
