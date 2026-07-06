"use client";

// Net kazanç hesaplayıcı formu: tamamen istemcide, canlı hesap (AI/API yok).
// Tüm oranlar varsayılanla önceden doldurulur ve DÜZENLENEBİLİR — platform/
// vergi oranları zamanla değişir; sorumluluk kullanıcıya bırakılır (uyarı notu).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Wallet, Info, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  computeNetEarnings, PLATFORM_FEE_DEFAULTS, TRANSFER_METHOD_DEFAULTS, TAX_PRESETS,
  type EarningsPlatform, type TransferMethod,
} from "@/lib/earnings/calculator";
import { parseLocaleNumber } from "@/lib/format/parse-number";

const PLATFORM_LABELS: Record<EarningsPlatform, string> = {
  upwork: "Upwork",
  fiverr: "Fiverr",
  bionluk: "Bionluk",
  custom: "", // i18n'den gelir (platformCustom)
};

type Currency = "USD" | "TRY";

export function EarningsCalculator({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("earnings");
  const locale = useLocale();
  // Locale-farkında ayrıştırma: TR "50.000"→50000, EN "10.5"→10.5.
  const numOr = useCallback((v: string, fallback = 0) => parseLocaleNumber(v, locale, fallback), [locale]);

  const [platform, setPlatform] = useState<EarningsPlatform>("upwork");
  const [gross, setGross] = useState("1000");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [platformFee, setPlatformFee] = useState(String(PLATFORM_FEE_DEFAULTS.upwork));
  const [method, setMethod] = useState<TransferMethod>("payoneer");
  const [transferPct, setTransferPct] = useState(String(TRANSFER_METHOD_DEFAULTS.payoneer.pct));
  const [transferFixed, setTransferFixed] = useState(String(TRANSFER_METHOD_DEFAULTS.payoneer.fixed));
  const [taxPct, setTaxPct] = useState("0");
  const [fxRate, setFxRate] = useState("");
  const [fxAuto, setFxAuto] = useState(false);

  // Güncel USD→TRY kurunu bir kez API'den çek (public /api/fx, 6 saat cache).
  // Yalnız alan boşsa doldur → kullanıcının elle girdiğini EZMEZ. API düşerse
  // (rate:null) sessizce elle girişe düşülür. Locale-farkında biçimlendirilir.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || typeof d?.rate !== "number") return;
        setFxRate((prev) => {
          if (prev.trim() !== "") return prev; // elle girilmişse dokunma
          setFxAuto(true);
          return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(d.rate);
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  function pickPlatform(p: EarningsPlatform) {
    setPlatform(p);
    setPlatformFee(String(PLATFORM_FEE_DEFAULTS[p]));
    // Bionluk TL öder; global platformlar USD.
    setCurrency(p === "bionluk" ? "TRY" : "USD");
  }

  function pickMethod(m: TransferMethod) {
    setMethod(m);
    setTransferPct(String(TRANSFER_METHOD_DEFAULTS[m].pct));
    setTransferFixed(String(TRANSFER_METHOD_DEFAULTS[m].fixed));
  }

  const result = useMemo(() => computeNetEarnings({
    gross: numOr(gross),
    platformFeePct: numOr(platformFee),
    transferFeePct: numOr(transferPct),
    transferFeeFixed: numOr(transferFixed),
    taxPct: numOr(taxPct),
    fxRate: currency === "USD" ? numOr(fxRate) || null : null,
  }), [gross, platformFee, transferPct, transferFixed, taxPct, fxRate, currency, numOr]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }),
    [locale, currency],
  );
  const fmtTry = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "TRY", maximumFractionDigits: 2 }),
    [locale],
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
        {/* Platform */}
        <div className="space-y-2">
          <p className={labelCls}>{t("platform")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_FEE_DEFAULTS) as EarningsPlatform[]).map((p) => (
              <button key={p} type="button" aria-pressed={platform === p} onClick={() => pickPlatform(p)} className={chipCls(platform === p)}>
                {p === "custom" ? t("platformCustom") : PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Brüt + para birimi */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls} htmlFor="earn-gross">{t("gross")}</label>
            <Input id="earn-gross" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} className={inputCls} />
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

        {/* Komisyon */}
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="earn-fee">{t("platformFee")}</label>
          <Input id="earn-fee" inputMode="decimal" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} className={inputCls} />
        </div>

        {/* Transfer */}
        <div className="space-y-2">
          <p className={labelCls}>{t("transferMethod")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TRANSFER_METHOD_DEFAULTS) as TransferMethod[]).map((m) => (
              <button key={m} type="button" aria-pressed={method === m} onClick={() => pickMethod(m)} className={chipCls(method === m)}>
                {t(`method.${m}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="earn-tpct">{t("transferPct")}</label>
              <Input id="earn-tpct" inputMode="decimal" value={transferPct} onChange={(e) => setTransferPct(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="earn-tfix">{t("transferFixed")}</label>
              <Input id="earn-tfix" inputMode="decimal" value={transferFixed} onChange={(e) => setTransferFixed(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Vergi */}
        <div className="space-y-2">
          <label className={labelCls} htmlFor="earn-tax">{t("tax")}</label>
          <div className="flex flex-wrap items-center gap-2">
            {TAX_PRESETS.map((p) => (
              <button key={p} type="button" aria-pressed={numOr(taxPct) === p} onClick={() => setTaxPct(String(p))} className={chipCls(numOr(taxPct) === p)}>%{p}</button>
            ))}
            <Input id="earn-tax" inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <p className="text-[11px] text-muted-foreground/70">{t("taxHint")}</p>
        </div>

        {/* Kur (yalnız USD) — açılışta güncel kur otomatik dolar, düzenlenebilir. */}
        {currency === "USD" && (
          <div className="space-y-1.5">
            <label className={labelCls} htmlFor="earn-fx">{t("fxRate")}</label>
            <Input id="earn-fx" inputMode="decimal" value={fxRate} onChange={(e) => { setFxRate(e.target.value); setFxAuto(false); }} placeholder={t("fxPlaceholder")} className={inputCls} />
            {fxAuto && <p className="text-[11px] text-muted-foreground/70">{t("fxAuto")}</p>}
          </div>
        )}
      </div>

      {/* Sonuç */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00F0FF] flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />{t("resultTitle")}
          </p>
          <div>
            <p className="text-3xl font-extrabold tabular-nums">{fmt.format(result.net)}</p>
            {result.netConverted !== null && (
              <p className="text-sm font-semibold text-muted-foreground tabular-nums mt-0.5">≈ {fmtTry.format(result.netConverted)}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">{t("netPct", { pct: result.netPct })}</p>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#00F0FF]/15 text-xs tabular-nums">
            {[
              { label: t("rows.gross"), value: fmt.format(result.gross), neg: false },
              { label: t("rows.platformFee"), value: fmt.format(result.platformFee), neg: true },
              { label: t("rows.transferFee"), value: fmt.format(result.transferFee), neg: true },
              { label: t("rows.tax"), value: fmt.format(result.tax), neg: true },
            ].map(({ label, value, neg }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={neg ? "text-red-600 dark:text-red-400" : "font-semibold"}>{neg ? "−" : ""}{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 border-t border-[#00F0FF]/15">
              <span className="font-semibold">{t("rows.net")}</span>
              <span className="font-bold text-[#00F0FF]">{fmt.format(result.net)}</span>
            </div>
          </div>
        </div>

        <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {t("disclaimer")}
        </p>

        {/* Bağlamsal signup köprüsü (analyze deseni) — yalnız kayıtsıza. */}
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
