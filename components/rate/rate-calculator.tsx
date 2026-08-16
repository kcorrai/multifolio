"use client";

// Ücret hesaplayıcı — Solar Pop tasarımı (docs/design/solar-pop/multifolio-free-tools-solar-pop.html).
// Tamamen istemcide, canlı hesap (AI/API/kredi yok). Hesap çekirdeği DEĞİŞMEDİ:
// lib/rate/calculator.ts (vitest'li). Buradaki değişiklik yalnız sunum + iki yeni
// girdi: platform ön ayarı korunur, "bugün ne alıyorsun" alanı FARK panelini besler.
// Para birimi USD sabit (GLOBAL-ONLY geçişi — TRY seçici kaldırıldı).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowUpRight, Check } from "lucide-react";
import { Card, CardHead, BigNumber, ShareMark, TwoCol, StickyResult } from "@/components/solar/primitives";
import { NumField, SliderField } from "@/components/solar/fields";
import {
  computeSuggestedRate, RATE_PLATFORM_DEFAULTS, RATE_DEFAULTS, type RatePlatform,
} from "@/lib/rate/calculator";

const PLATFORM_LABEL: Record<RatePlatform, string> = { upwork: "Upwork", fiverr: "Fiverr", direct: "" };

/** Bir iki-haftalık projenin faturalanabilir saati (design komp'undaki üçüncü rakam). */
const PROJECT_HOURS = 80;

const numOf = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

// Dönüşüm CTA'sı artık kabuğun çapraz-link panelinde (ToolShell) — burada yok.
export function RateCalculator() {
  const t = useTranslations("rate");
  const ts = useTranslations("tools.shared");
  const locale = useLocale();

  const [platform, setPlatform] = useState<RatePlatform>("upwork");
  const [targetNet, setTargetNet] = useState(String(RATE_DEFAULTS.targetNetMonthly));
  const [expenses, setExpenses] = useState(String(RATE_DEFAULTS.monthlyExpenses));
  const [hours, setHours] = useState(String(RATE_DEFAULTS.billableHoursPerWeek));
  const [weeksOff, setWeeksOff] = useState(String(RATE_DEFAULTS.weeksOffPerYear));
  const [taxPct, setTaxPct] = useState<number>(RATE_DEFAULTS.taxPct);
  const [feePct, setFeePct] = useState<number>(RATE_DEFAULTS.platformFeePct);
  const [current, setCurrent] = useState("");

  function pickPlatform(p: RatePlatform) {
    setPlatform(p);
    setFeePct(RATE_PLATFORM_DEFAULTS[p]);
  }

  const result = useMemo(() => computeSuggestedRate({
    targetNetMonthly: numOf(targetNet),
    monthlyExpenses: numOf(expenses),
    billableHoursPerWeek: numOf(hours),
    weeksOffPerYear: numOf(weeksOff),
    taxPct,
    platformFeePct: feePct,
  }), [targetNet, expenses, hours, weeksOff, taxPct, feePct]);

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    [locale],
  );
  const money2 = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
    [locale],
  );

  const currentRate = numOf(current);
  const gap = result.requiredHourlyRate - currentRate;
  const short = gap > 0;
  // Bugünkü ücretle ele geçen: brüt → komisyon → vergi → gider (motorun tersi).
  const currentTakeHome =
    currentRate * result.monthlyBillableHours * (1 - feePct / 100) * (1 - taxPct / 100) - numOf(expenses);
  const risePct = currentRate > 0 ? Math.round((result.requiredHourlyRate / currentRate - 1) * 100) : 0;

  /* ── Girdiler ─────────────────────────────────────────────────────── */
  const inputs = (
    <Card>
      <CardHead title={t("sp.inputsTitle")} />

      <NumField
        id="rate-net"
        label={t("targetNet")}
        hint={t("sp.netHint")}
        prefix="$"
        step={250}
        value={targetNet}
        onChange={setTargetNet}
      />

      <div className="grid min-w-0 grid-cols-2 gap-3.5">
        <NumField
          id="rate-hours"
          label={t("billableHours")}
          hint={t("sp.hoursHint")}
          value={hours}
          onChange={setHours}
        />
        <NumField
          id="rate-off"
          label={t("weeksOff")}
          hint={t("sp.weeksOffHint")}
          value={weeksOff}
          onChange={setWeeksOff}
        />
      </div>

      <NumField
        id="rate-exp"
        label={t("expenses")}
        hint={t("expensesHint")}
        prefix="$"
        step={50}
        value={expenses}
        onChange={setExpenses}
      />

      <div className="grid gap-2.5">
        <span className="sp-label" style={{ color: "var(--text-strong)" }}>{t("platform")}</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RATE_PLATFORM_DEFAULTS) as RatePlatform[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={platform === p}
              onClick={() => pickPlatform(p)}
              className={`sp-chip ${platform === p ? "sp-chip--flame" : ""}`}
            >
              {p === "direct" ? t("platformDirect") : PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3.5">
        <SliderField id="rate-fee" label={t("sp.fee")} min={0} max={30} value={feePct} suffix="%" onChange={setFeePct} />
        <SliderField id="rate-tax" label={t("sp.tax")} min={0} max={55} value={taxPct} suffix="%" onChange={setTaxPct} />
      </div>

      <NumField
        id="rate-current"
        label={t("sp.current")}
        hint={t("sp.currentHint")}
        prefix="$"
        suffix="/hr"
        value={current}
        onChange={setCurrent}
      />
    </Card>
  );

  /* ── Sonuç ────────────────────────────────────────────────────────── */
  const output = !result.feasible ? (
    <Card>
      <CardHead title={t("sp.resultTitle")} />
      <p className="sp-body inline-flex items-start gap-2.5">
        <AlertTriangle size={18} style={{ color: "var(--flame-600)", flexShrink: 0, marginTop: 2 }} />
        {t("infeasible")}
      </p>
    </Card>
  ) : (
    <>
      <Card>
        <CardHead
          title={t("sp.resultTitle")}
          right={<span aria-live="polite" className="sp-label">{ts("live")}</span>}
        />

        <div className="sp-three">
          <BigNumber
            primary
            label={t("sp.hourly")}
            value={`${money2.format(result.requiredHourlyRate)}/hr`}
            sub={t("sp.hourlySub", { hours: Math.round(result.monthlyBillableHours) })}
          />
          <BigNumber label={t("sp.dayRate")} value={money.format(result.requiredDayRate)} sub={t("sp.daySub")} />
          <BigNumber
            label={t("sp.project")}
            value={money.format(result.requiredHourlyRate * PROJECT_HOURS)}
            sub={t("sp.projectSub", { hours: PROJECT_HOURS })}
          />
        </div>

        {currentRate > 0 ? (
          <div
            className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-[22px]"
            style={{ background: short ? "var(--amber-200)" : "var(--surface-card-alt)" }}
          >
            <span className="sp-title inline-flex items-center gap-2.5">
              {short ? <ArrowUpRight size={18} /> : <Check size={18} />}
              {short
                ? t("sp.gapShort", { amount: money2.format(gap) })
                : t("sp.gapClear", { amount: money2.format(-gap) })}
            </span>
            <span className="sp-body">
              {short
                ? t("sp.gapShortBody", {
                    rate: money2.format(currentRate),
                    takeHome: money.format(Math.max(0, currentTakeHome)),
                    rise: risePct,
                  })
                : t("sp.gapClearBody")}
            </span>
          </div>
        ) : null}

        <ShareMark href="/rate" note={ts("shareMark")} />
      </Card>

      <Card tone="tint">
        <CardHead title={t("sp.breakdownTitle")} />
        <div className="grid gap-1">
          {[
            { label: t("rows.net"), value: money.format(result.net), total: false },
            { label: t("rows.expenses"), value: money.format(result.expenses), total: false },
            { label: t("sp.taxRow", { pct: taxPct }), value: money.format(result.tax), total: false },
            { label: t("sp.feeRow", { pct: feePct }), value: money.format(result.platformFee), total: false },
            { label: t("sp.grossRow"), value: money.format(result.requiredMonthlyGross), total: true },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 px-[15px] py-[13px]"
              style={{
                background: row.total ? "var(--ink-900)" : "transparent",
                borderRadius: row.total ? "var(--radius-sp-md)" : 0,
                borderBottom: row.total ? "none" : "var(--border-hairline)",
              }}
            >
              <span
                className="sp-label"
                style={{ letterSpacing: ".04em", fontSize: "var(--fs-body-s)", color: row.total ? "var(--white)" : "var(--text-body)" }}
              >
                {row.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  font: "var(--fw-black) var(--fs-body)/1 var(--font-display)",
                  color: row.total ? "var(--white)" : "var(--text-strong)",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <p className="sp-body sp-body--small">
          {t("hoursNote", { monthly: Math.round(result.monthlyBillableHours), weeks: result.workingWeeks })}
        </p>
        <p className="sp-body sp-body--small">{t("disclaimer")}</p>
      </Card>
    </>
  );

  return (
    <>
      <TwoCol inputs={inputs} output={output} />
      {result.feasible ? (
        <StickyResult
          label={t("sp.hourly")}
          value={`${money2.format(result.requiredHourlyRate)}/hr`}
          cta={ts("fullResult")}
        />
      ) : null}
    </>
  );
}
