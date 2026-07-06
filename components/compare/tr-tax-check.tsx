"use client";

// TR vergi avantajı uygunluk checker'ı: 4 evet/hayır soru → hizmet ihracı indirimi +
// genç girişimci istisnası uygunluğu + KABA matrah indirimi tahmini. Tamamen istemcide,
// AI/API/kredi yok. GÜÇLÜ "mali müşavire danış" uyarısı + GİB linki; vergi danışmanlığı değil.
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check, X, Info, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  assessTrTax, estimateTrTaxBase, TR_TAX_RATES, TR_TAX_YEARS, TR_TAX_YEAR_DEFAULT,
  type TrTaxAnswers,
} from "@/lib/compare/tr-tax";
import { parseLocaleNumber } from "@/lib/format/parse-number";

const QUESTION_KEYS: (keyof TrTaxAnswers)[] = [
  "foreignClients",
  "professionInScope",
  "invoicesFromTurkey",
  "youngFirstTime",
];

const GIB_URL = "https://www.gib.gov.tr";

export function TrTaxCheck({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("trTax");
  const locale = useLocale();
  // Locale-farkında ayrıştırma: TR "50.000"→50000, EN "10.5"→10.5.
  const numOr = useCallback((v: string, fallback = 0) => parseLocaleNumber(v, locale, fallback), [locale]);

  const [year, setYear] = useState<number>(TR_TAX_YEAR_DEFAULT);
  const [answers, setAnswers] = useState<TrTaxAnswers>({
    foreignClients: true,
    professionInScope: true,
    invoicesFromTurkey: true,
    youngFirstTime: false,
  });
  const [income, setIncome] = useState("");

  const rates = TR_TAX_RATES[year];
  const result = useMemo(() => assessTrTax(answers), [answers]);
  const estimate = useMemo(
    () => estimateTrTaxBase(numOr(income), rates, result),
    [income, rates, result, numOr],
  );

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }),
    [locale],
  );

  const labelCls = "text-xs font-semibold text-muted-foreground";
  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      active ? "border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]" : "border-border text-muted-foreground hover:text-foreground"
    }`;

  function setAnswer(k: keyof TrTaxAnswers, v: boolean) {
    setAnswers((s) => ({ ...s, [k]: v }));
  }

  const showEstimate = numOr(income) > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Sorular */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <div className="space-y-2">
          <p className={labelCls}>{t("yearLabel")}</p>
          <div className="flex gap-2">
            {TR_TAX_YEARS.map((y) => (
              <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)} className={chipCls(year === y)}>{y}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {QUESTION_KEYS.map((k) => (
            <div key={k} className="flex items-start justify-between gap-3">
              <p className="text-sm leading-snug flex-1">{t(`q.${k}`)}</p>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" aria-pressed={answers[k]} onClick={() => setAnswer(k, true)} className={chipCls(answers[k])}>{t("yes")}</button>
                <button type="button" aria-pressed={!answers[k]} onClick={() => setAnswer(k, false)} className={chipCls(!answers[k])}>{t("no")}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-1">
          <label className={labelCls} htmlFor="tax-income">{t("incomeLabel")}</label>
          <Input id="tax-income" inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} placeholder={t("incomePlaceholder")} className="h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground/70">{t("incomeHint")}</p>
        </div>
      </div>

      {/* Sonuç */}
      <div className="space-y-3">
        {/* Hizmet ihracı indirimi */}
        <ResultCard
          ok={result.hizmetIhraci === "likely"}
          title={t("hizmetIhraci.title")}
          body={result.hizmetIhraci === "likely" ? t("hizmetIhraci.likely", { pct: rates.hizmetIhraciPct, year }) : t("hizmetIhraci.no")}
        />
        {/* Genç girişimci */}
        <ResultCard
          ok={result.gencGirisimci === "likely"}
          title={t("gencGirisimci.title")}
          body={result.gencGirisimci === "likely" ? t("gencGirisimci.likely", { cap: fmt.format(rates.gencGirisimciCap), year }) : t("gencGirisimci.no")}
        />

        {/* Kaba tahmin */}
        {showEstimate && (
          <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00F0FF] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />{t("est.title")}
            </p>
            <div className="space-y-1 text-xs tabular-nums">
              {estimate.gencGirisimciExempt > 0 && (
                <Row label={t("est.gencExempt")} value={`−${fmt.format(estimate.gencGirisimciExempt)}`} />
              )}
              {estimate.hizmetIhraciDeduction > 0 && (
                <Row label={t("est.hizmetDeduction")} value={`−${fmt.format(estimate.hizmetIhraciDeduction)}`} />
              )}
              <div className="flex items-center justify-between pt-1 border-t border-[#00F0FF]/15">
                <span className="font-semibold">{t("est.remaining")}</span>
                <span className="font-bold text-[#00F0FF]">{fmt.format(estimate.remainingBase)}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("est.shielded", { pct: estimate.shieldedPct })}</p>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/90 leading-relaxed">{t("kdvNote")}</p>
        {year === 2026 && <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">{t("bagkurNote")}</p>}

        <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />{t("disclaimer")}
        </p>
        <a href={GIB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00F0FF] hover:underline">
          {t("sourceLink")}<ExternalLink className="h-3 w-3" />
        </a>

        {!isLoggedIn && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2">
            <p className="text-sm font-semibold">{t("ctaTitle")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("ctaBody")}</p>
            <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 transition-colors">
              {t("ctaButton")}<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ ok, title, body }: { ok: boolean; title: string; body: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${ok ? "border-emerald-300/50 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20" : "border-border bg-card"}`}>
      <p className="flex items-center gap-2 font-bold text-sm">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${ok ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
        {title}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{value}</span>
    </div>
  );
}
