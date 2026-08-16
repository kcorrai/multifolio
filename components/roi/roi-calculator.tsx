"use client";

// Teklif ROI hesaplayıcı — Solar Pop tasarımı. Tamamen istemcide (AI/API/kredi yok).
// Hesap çekirdeği DEĞİŞMEDİ: lib/roi/calculator.ts (vitest'li).
// Sunum kararı: üç rakam "neyi değiştirdikleri" sırasına dizilir — ROI çarpanı
// başat, kazanç başına maliyet ikincil, başabaş oranı eşik. Altta "kazanma oranın
// oynasaydı" tablosu, çünkü tek hareket ettirilebilir kaldıraç o.
// Para birimi USD sabit (GLOBAL-ONLY geçişi — TRY seçici kaldırıldı).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Asterisk, Check } from "lucide-react";
import { Card, CardHead, BigNumber, ShareMark, TwoCol, StickyResult } from "@/components/solar/primitives";
import { NumField, SliderField } from "@/components/solar/fields";
import { computeRoi, ROI_DEFAULTS } from "@/lib/roi/calculator";

/** Bu eşiğin üstünde teklif harcaması kendini rahat çıkarıyor sayılır. */
const HEALTHY_ROI = 10;

const numOf = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function RoiCalculator() {
  const t = useTranslations("roi");
  const ts = useTranslations("tools.shared");
  const locale = useLocale();

  const [proposals, setProposals] = useState(String(ROI_DEFAULTS.proposalsSent));
  const [connectsPer, setConnectsPer] = useState(String(ROI_DEFAULTS.connectsPerProposal));
  const [costPer, setCostPer] = useState(String(ROI_DEFAULTS.costPerConnect));
  const [winRate, setWinRate] = useState<number>(ROI_DEFAULTS.winRatePct);
  const [projectValue, setProjectValue] = useState(String(ROI_DEFAULTS.avgProjectValue));

  const result = useMemo(() => computeRoi({
    proposalsSent: numOf(proposals),
    connectsPerProposal: numOf(connectsPer),
    costPerConnect: numOf(costPer),
    winRatePct: winRate,
    avgProjectValue: numOf(projectValue),
  }), [proposals, connectsPer, costPer, winRate, projectValue]);

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    [locale],
  );
  const money2 = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
    [locale],
  );
  const dec = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);

  const healthy = result.feasible && result.roiMultiple >= HEALTHY_ROI;
  // Kazanma oranındaki BİR puanın aylık değeri — hacim kısmaktan daha etkili.
  const pointValue = numOf(proposals) * 0.01 * numOf(projectValue);

  /* ── Girdiler ─────────────────────────────────────────────────────── */
  const inputs = (
    <Card>
      <CardHead title={t("sp.inputsTitle")} />
      <NumField id="roi-proposals" label={t("proposalsSent")} value={proposals} onChange={setProposals} />
      <div className="grid min-w-0 grid-cols-2 gap-3.5">
        <NumField
          id="roi-connects"
          label={t("connectsPerProposal")}
          hint={t("connectsHint")}
          value={connectsPer}
          onChange={setConnectsPer}
        />
        <NumField
          id="roi-cost"
          label={t("costPerConnect")}
          hint={t("costHint")}
          prefix="$"
          step={0.05}
          value={costPer}
          onChange={setCostPer}
        />
      </div>
      <SliderField
        id="roi-win"
        label={t("winRate")}
        hint={t("winRateHint")}
        min={0}
        max={40}
        step={0.5}
        value={winRate}
        suffix="%"
        onChange={setWinRate}
      />
      <NumField
        id="roi-value"
        label={t("avgProjectValue")}
        prefix="$"
        step={100}
        value={projectValue}
        onChange={setProjectValue}
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
        <CardHead title={t("sp.resultTitle")} right={<span aria-live="polite" className="sp-label">{ts("live")}</span>} />

        <div className="sp-three">
          <BigNumber
            primary
            label={t("sp.roiLabel")}
            value={`${dec.format(result.roiMultiple)}×`}
            sub={t("sp.roiSub", { spend: money2.format(result.totalConnectCost), won: money.format(result.revenue) })}
          />
          <BigNumber
            label={t("sp.costPerWin")}
            value={result.wins > 0 ? money2.format(result.costPerWin) : "—"}
            sub={t("sp.winsSub", { wins: dec.format(result.wins) })}
          />
          <BigNumber
            label={t("sp.breakEven")}
            value={`${dec.format(result.breakEvenWinRatePct)}%`}
            sub={t("sp.breakEvenSub")}
          />
        </div>

        <div
          className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-5"
          style={{ background: healthy ? "var(--surface-card-alt)" : "var(--amber-200)" }}
        >
          <span className="sp-sub inline-flex items-center gap-2.5">
            {healthy ? <Check size={16} /> : <Asterisk size={16} />}
            {healthy ? t("sp.verdictGood") : t("sp.verdictThin")}
          </span>
          <span className="sp-body">
            {t("sp.verdictBody", {
              position: winRate >= result.breakEvenWinRatePct
                ? t("sp.above", { times: dec.format(winRate / Math.max(0.01, result.breakEvenWinRatePct)) })
                : t("sp.below"),
              point: money.format(pointValue),
            })}
          </span>
        </div>

        <ShareMark href="/roi" note={ts("shareMark")} />
      </Card>

      <Card tone="tint">
        <CardHead title={t("sp.scenarioTitle")} />
        <div className="grid gap-[9px]">
          {[winRate / 2, winRate, winRate * 1.5, winRate * 2].map((w, i) => {
            const revenue = numOf(proposals) * (w / 100) * numOf(projectValue);
            const multiple = result.totalConnectCost > 0 ? revenue / result.totalConnectCost : 0;
            const now = i === 1;
            return (
              <div
                key={i}
                className="grid items-center gap-3 rounded-[var(--radius-sp-md)] px-[15px] py-[13px]"
                style={{
                  gridTemplateColumns: "74px 1fr 92px",
                  background: now ? "var(--surface-inverse)" : "var(--surface-page)",
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    font: "var(--fw-black) var(--fs-body)/1 var(--font-display)",
                    color: now ? "var(--white)" : "var(--text-strong)",
                  }}
                >
                  {dec.format(w)}%
                </span>
                <span
                  className="h-[9px] overflow-hidden rounded-[var(--radius-pill)]"
                  style={{ background: now ? "rgba(255,255,255,.28)" : "var(--cream-300)" }}
                >
                  <span
                    className="block h-full"
                    style={{
                      width: `${Math.min(100, multiple * 3)}%`,
                      background: now ? "var(--white)" : "var(--pink-500)",
                    }}
                  />
                </span>
                <span
                  className="text-right tabular-nums"
                  style={{
                    font: "var(--fw-black) var(--fs-body)/1 var(--font-display)",
                    color: now ? "var(--white)" : "var(--text-strong)",
                  }}
                >
                  {money.format(revenue)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="sp-body sp-body--small">{t("sp.scenarioNote")}</p>
        <p className="sp-body sp-body--small">{t("disclaimer")}</p>
      </Card>
    </>
  );

  return (
    <>
      <TwoCol inputs={inputs} output={output} />
      {result.feasible ? (
        <StickyResult label={t("sp.roiLabel")} value={`${dec.format(result.roiMultiple)}×`} cta={ts("fullResult")} />
      ) : null}
    </>
  );
}
