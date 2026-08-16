"use client";

// Başlık optimize edici — Solar Pop tasarımı. Tamamen istemcide (AI/API/kredi yok).
// Puan çekirdeği DEĞİŞMEDİ: lib/headline/scorer.ts (ağırlıklı 4 eksen).
// Tasarım kararı: eksenler DOLU/BOŞ çubuk olarak gösterilir — motor boolean üretir,
// ara ton uydurmak sahte hassasiyet olurdu; kaç puan değdiği etiketle söylenir.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHead, ScoreBlock, Bar, EmptyStance, ShareMark, TwoCol } from "@/components/solar/primitives";
import { TextField } from "@/components/solar/fields";
import { scoreHeadline, type HeadlineCheckId } from "@/lib/headline/scorer";

const CHECK_ORDER: HeadlineCheckId[] = ["role", "outcome", "length", "noBuzzwords"];
const REWRITES = ["linkedin", "upwork", "fiverr"] as const;
const REWRITE_BG: Record<(typeof REWRITES)[number], string> = {
  linkedin: "var(--surface-card-peach)",
  upwork: "var(--surface-card-alt)",
  fiverr: "var(--amber-200)",
};

export function HeadlineOptimizer() {
  const t = useTranslations("headlineOptimizer");
  const ts = useTranslations("tools.shared");
  const [text, setText] = useState("");

  const report = useMemo(() => scoreHeadline(text), [text]);
  const has = text.trim().length > 0;

  const inputs = (
    <Card>
      <TextField
        id="headline"
        label={t("inputLabel")}
        hint={t("sp.inputHint")}
        value={text}
        onChange={setText}
        placeholder={t("placeholder")}
      />
      <span className="sp-label" style={{ letterSpacing: ".06em", color: report.charCount > 90 ? "var(--pink-600)" : "var(--text-muted)" }}>
        {t("sp.charNote", { count: report.charCount })}
      </span>
      <div className="grid gap-2.5 rounded-[var(--radius-sp-md)] p-4" style={{ background: "var(--surface-page)" }}>
        <span className="sp-label" style={{ color: "var(--text-strong)" }}>{t("sp.formulaTitle")}</span>
        <span className="sp-body sp-body--small">{t("formula")}</span>
      </div>
    </Card>
  );

  const output = has ? (
    <>
      <Card>
        <ScoreBlock
          value={report.score}
          words={[t("sp.words.strong"), t("sp.words.average"), t("sp.words.weak")]}
          scale={t("sp.scale")}
          scaleNote={ts("scaleNote")}
        />

        <div className="grid gap-3.5">
          {CHECK_ORDER.map((id) => {
            const c = report.checks.find((x) => x.id === id);
            const passed = !!c?.passed;
            return (
              <div key={id} className="grid gap-[7px]">
                <Bar
                  label={t(`sp.axes.${id}.label`)}
                  pct={passed ? 100 : 0}
                  ink={passed ? "var(--pink-500)" : "var(--flame-500)"}
                />
                <span className="sp-body" style={{ fontSize: "var(--fs-label)", lineHeight: 1.5 }}>
                  {t(`sp.axes.${id}.note`)} · {t("sp.worth", { points: c?.weight ?? 0 })}
                </span>
              </div>
            );
          })}
        </div>

        {report.buzzwordsFound.length > 0 ? (
          <div className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-5" style={{ background: "var(--amber-200)" }}>
            <span className="sp-sub">{t("buzzwordLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {report.buzzwordsFound.map((b) => (
                <span
                  key={b}
                  className="sp-label rounded-[var(--radius-pill)] px-3 py-1.5"
                  style={{ background: "var(--white)", color: "var(--flame-600)" }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <ShareMark href="/headline-optimizer" note={ts("shareMark")} />
      </Card>

      <Card tone="tint">
        <CardHead title={t("sp.rewritesTitle")} />
        <div className="grid gap-3">
          {REWRITES.map((p) => (
            <div key={p} className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-[18px]" style={{ background: REWRITE_BG[p] }}>
              <span className="sp-label" style={{ color: "var(--ink-900)" }}>{t(`sp.rewrites.${p}.platform`)}</span>
              <span style={{ font: "var(--fw-medium) var(--fs-body)/1.6 var(--font-body)", color: "var(--text-strong)" }}>
                {t(`sp.rewrites.${p}.text`)}
              </span>
            </div>
          ))}
        </div>
        {/* Dürüstlük notu: bunlar desenden gelir, kullanıcının geçmişinden değil. */}
        <p className="sp-body sp-body--small">{t("sp.rewritesNote")}</p>
        <p className="sp-body sp-body--small">{t("disclaimer")}</p>
      </Card>
    </>
  ) : (
    <Card>
      <EmptyStance title={t("sp.emptyTitle")} body={t("sp.emptyBody")} />
    </Card>
  );

  return <TwoCol inputs={inputs} output={output} />;
}
