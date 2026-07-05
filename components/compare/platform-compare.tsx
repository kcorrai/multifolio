"use client";

// Çok-platform net gelir karşılaştırıcı formu: tek proje tutarını 5 platformda
// yan yana koyar (SAF lib/compare/platforms.ts). Tamamen istemcide, AI/API/kredi yok.
// Transfer + vergi tüm platformlara eşit uygulanır → fark platform komisyonundan.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Trophy, Info, ArrowRight, TicketPercent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TRANSFER_METHOD_DEFAULTS, TAX_PRESETS, type TransferMethod } from "@/lib/earnings/calculator";
import { comparePlatforms, type ComparePlatform } from "@/lib/compare/platforms";

const PLATFORM_LABELS: Record<ComparePlatform, string> = {
  direct: "", // i18n platform.direct
  upwork: "Upwork",
  fiverr: "Fiverr",
  bionluk: "Bionluk",
};

type Currency = "USD" | "TRY";

function numOr(v: string, fallback = 0): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function PlatformCompare({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("compare");
  const locale = useLocale();

  const [gross, setGross] = useState("1000");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [method, setMethod] = useState<TransferMethod>("payoneer");
  const [transferPct, setTransferPct] = useState(String(TRANSFER_METHOD_DEFAULTS.payoneer.pct));
  const [transferFixed, setTransferFixed] = useState(String(TRANSFER_METHOD_DEFAULTS.payoneer.fixed));
  const [taxPct, setTaxPct] = useState("0");

  function pickMethod(m: TransferMethod) {
    setMethod(m);
    setTransferPct(String(TRANSFER_METHOD_DEFAULTS[m].pct));
    setTransferFixed(String(TRANSFER_METHOD_DEFAULTS[m].fixed));
  }

  const rows = useMemo(() => comparePlatforms({
    gross: numOr(gross),
    transferFeePct: numOr(transferPct),
    transferFeeFixed: numOr(transferFixed),
    taxPct: numOr(taxPct),
  }), [gross, transferPct, transferFixed, taxPct]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );

  const best = rows[0]?.net ?? 0;
  const platformLabel = (p: ComparePlatform) => (p === "direct" ? t("platform.direct") : PLATFORM_LABELS[p]);

  const inputCls = "h-9 text-sm";
  const labelCls = "text-xs font-semibold text-muted-foreground";
  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      active
        ? "border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]"
        : "border-border text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Girdi */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 lg:self-start">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="cmp-gross">{t("gross")}</label>
              <Input id="cmp-gross" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <p className={labelCls}>{t("currency")}</p>
              <div className="flex gap-2">
                {(["USD", "TRY"] as Currency[]).map((c) => (
                  <button key={c} onClick={() => setCurrency(c)} className={chipCls(currency === c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className={labelCls}>{t("transferMethod")}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TRANSFER_METHOD_DEFAULTS) as TransferMethod[]).map((m) => (
                <button key={m} onClick={() => pickMethod(m)} className={chipCls(method === m)}>{t(`method.${m}`)}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="cmp-tpct">{t("transferPct")}</label>
                <Input id="cmp-tpct" inputMode="decimal" value={transferPct} onChange={(e) => setTransferPct(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="cmp-tfix">{t("transferFixed")}</label>
                <Input id="cmp-tfix" inputMode="decimal" value={transferFixed} onChange={(e) => setTransferFixed(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls} htmlFor="cmp-tax">{t("tax")}</label>
            <div className="flex flex-wrap items-center gap-2">
              {TAX_PRESETS.map((p) => (
                <button key={p} onClick={() => setTaxPct(String(p))} className={chipCls(numOr(taxPct) === p)}>%{p}</button>
              ))}
              <Input id="cmp-tax" inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={`${inputCls} w-20`} />
            </div>
          </div>
        </div>

        {/* Karşılaştırma sonucu */}
        <div className="space-y-2.5">
          {rows.map((r, i) => {
            const pct = best > 0 ? Math.round((r.net / best) * 100) : 0;
            return (
              <div
                key={r.platform}
                className={`rounded-2xl border p-4 ${i === 0 ? "border-[#00F0FF]/40 bg-[#00F0FF]/5" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {i === 0 && <Trophy className="h-4 w-4 shrink-0 text-[#00F0FF]" />}
                    <span className="font-bold truncate">{platformLabel(r.platform)}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">{t("feeChip", { pct: r.feePct })}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold tabular-nums leading-none">{fmt.format(r.net)}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{t("netPct", { pct: r.netPct })}</p>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${i === 0 ? "bg-[#00F0FF]" : "bg-muted-foreground/40"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          {/* Armut: yüzde modeli değil — teklif-başı ücret; ayrı bilgi kartı. */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
              <TicketPercent className="h-4 w-4 shrink-0" />Armut
            </p>
            <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-200/90 leading-relaxed">{t("armutNote")}</p>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />{t("disclaimer")}
      </p>

      {!isLoggedIn && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2 max-w-md">
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
  );
}
