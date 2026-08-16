"use client";

// Teklif denetçisi — Solar Pop tasarımı. Tamamen istemcide, canlı puan
// (AI/API/kredi yok). Kontrol çekirdeği DEĞİŞMEDİ: lib/proposal-check/checker.ts.
// Tasarım kararı: skor başlık, BULGULAR ürün. Ürüne köprü tek bir dürüst kutuda —
// "bu yapıyı denetler, metni yazmaz".
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Card, ScoreBlock, FindingsList, EmptyStance, ShareMark, TwoCol, type FindingItem,
} from "@/components/solar/primitives";
import { TextAreaField } from "@/components/solar/fields";
import { checkProposal, type CheckId } from "@/lib/proposal-check/checker";

const CHECK_ORDER: CheckId[] = ["clientFocus", "numbers", "question", "length", "noFiller"];

/** Cevap almayı doğrudan kesenler → engelleyici; kalanı "iyileştir". */
const BLOCKING: CheckId[] = ["numbers", "noFiller"];

export function ProposalChecker() {
  const t = useTranslations("proposalChecker");
  const ts = useTranslations("tools.shared");
  const [text, setText] = useState("");

  const report = useMemo(() => checkProposal(text), [text]);
  const has = text.trim().length > 0;

  const findings: FindingItem[] = CHECK_ORDER.map((id) => {
    const c = report.checks.find((x) => x.id === id);
    const passed = !!c?.passed;
    return {
      level: passed ? "pass" : BLOCKING.includes(id) ? "fail" : "warn",
      title: t(`sp.checks.${id}.${passed ? "pass" : "fail"}`),
      body: t(`sp.checks.${id}.body`),
    };
  });

  const counts = {
    total: findings.length,
    fails: findings.filter((f) => f.level === "fail").length,
    warns: findings.filter((f) => f.level === "warn").length,
  };

  const inputs = (
    <Card>
      <TextAreaField
        id="proposal-text"
        label={t("inputLabel")}
        hint={t("sp.inputHint")}
        rows={14}
        value={text}
        onChange={setText}
        countLabel={has ? ts("wordCount", { count: report.wordCount }) : ts("nothingPasted")}
        note={ts("staysInBrowser")}
      />
      <button type="button" className="sp-btn sp-btn--sm sp-btn--ghost w-fit" onClick={() => setText("")}>
        {ts("clear")}
      </button>
    </Card>
  );

  const output = has ? (
    <Card>
      <ScoreBlock
        value={report.score}
        words={[t("sp.words.strong"), t("sp.words.average"), t("sp.words.weak")]}
        scale={t("sp.scale")}
        scaleNote={ts("scaleNote")}
      />

      <FindingsList items={findings} title={t("sp.findingsTitle")} countLabel={ts("checksCount", counts)} />

      {report.fillerFound.length > 0 ? (
        <div className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-5" style={{ background: "var(--amber-200)" }}>
          <span className="sp-sub">{t("sp.fillerTitle")}</span>
          <div className="flex flex-wrap gap-2">
            {report.fillerFound.map((f) => (
              <span
                key={f}
                className="sp-label rounded-[var(--radius-pill)] px-3 py-1.5"
                style={{ background: "var(--white)", color: "var(--flame-600)" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Ürüne dürüst köprü: bu araç yapı denetler, Multifolio metni yazar. */}
      <div className="grid gap-3 rounded-[var(--radius-sp-lg)] p-5" style={{ background: "var(--surface-card-peach)" }}>
        <span className="sp-sub">{t("sp.upsellTitle")}</span>
        <span className="sp-body">{t("sp.upsellBody")}</span>
        <Link href="/signup?ref=proposal-checker" className="sp-btn sp-btn--sm w-fit">{t("ctaButton")}</Link>
      </div>

      <p className="sp-body sp-body--small">{t("disclaimer")}</p>
      <ShareMark href="/proposal-checker" note={ts("shareMark")} />
    </Card>
  ) : (
    <Card>
      <EmptyStance
        title={t("sp.emptyTitle")}
        body={t("sp.emptyBody")}
        items={[
          t("sp.emptyList.opener"), t("sp.emptyList.number"), t("sp.emptyList.question"),
          t("sp.emptyList.length"), t("sp.emptyList.filler"),
        ]}
      />
    </Card>
  );

  return <TwoCol inputs={inputs} output={output} />;
}
