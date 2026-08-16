"use client";

// CV/ATS denetleyici — Solar Pop tasarımı. Tamamen istemcide, canlı skor
// (AI/API/kredi YOK, metin SUNUCUYA GİTMEZ). Skor çekirdeği DEĞİŞMEDİ:
// lib/cv/ats-text.ts.
// Tasarım kararı (komp'tan): bulgular üründür, skor başlıktır — ve ücretsiz
// araçlarda kilit YOKTUR; dönüşüm işini kabuğun çapraz-link paneli yapar.
// (Eski sürümdeki "3 kontrol bedava, kalanı üyelikle" teaser'ı kaldırıldı.)
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card, ScoreBlock, FindingsList, EmptyStance, ShareMark, TwoCol, StickyResult, type FindingItem,
} from "@/components/solar/primitives";
import { TextAreaField } from "@/components/solar/fields";
import { scoreResumeText, type ResumeCheckId } from "@/lib/cv/ats-text";

const CHECK_ORDER: ResumeCheckId[] = [
  "contact", "summary", "skills", "experience", "education",
  "quantified", "noFiller", "dates", "length", "keywords",
];

/** Bunlar düşünce ilan parser'ı kaydı bozar → engelleyici; diğerleri "iyileştir". */
const BLOCKING: ResumeCheckId[] = ["contact", "experience", "length"];

export function AtsCheckForm() {
  const t = useTranslations("atsCheck");
  const ts = useTranslations("tools.shared");
  const [cv, setCv] = useState("");
  const [job, setJob] = useState("");

  const report = useMemo(() => scoreResumeText(cv, job), [cv, job]);
  const has = cv.trim().length > 0;

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

  /* ── Girdiler ─────────────────────────────────────────────────────── */
  const inputs = (
    <>
      <Card>
        <TextAreaField
          id="cv"
          label={t("cvLabel")}
          hint={t("sp.cvHint")}
          rows={16}
          value={cv}
          onChange={setCv}
          countLabel={cv.trim() ? ts("wordCount", { count: report.wordCount }) : ts("nothingPasted")}
          note={ts("staysInBrowser")}
        />
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="sp-btn sp-btn--sm sp-btn--ghost" onClick={() => setCv("")}>
            {ts("clear")}
          </button>
        </div>
      </Card>

      <Card tone="tint">
        <TextAreaField
          id="job"
          label={t("jobLabel")}
          hint={t("jobHint")}
          rows={5}
          value={job}
          onChange={setJob}
          countLabel={job.trim() ? ts("wordCount", { count: job.trim().split(/\s+/).length }) : ts("nothingPasted")}
          note={ts("staysInBrowser")}
        />
      </Card>
    </>
  );

  /* ── Sonuç ────────────────────────────────────────────────────────── */
  const output = has ? (
    <Card>
      <ScoreBlock
        value={report.score}
        words={[t("sp.words.strong"), t("sp.words.average"), t("sp.words.weak")]}
        scale={t("sp.scale")}
        scaleNote={ts("scaleNote")}
      />

      {report.keywordCoverage !== null ? (
        <div className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-5" style={{ background: "var(--surface-card-peach)" }}>
          <span className="sp-sub">{t("keywordCoverage", { pct: report.keywordCoverage })}</span>
          {report.missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.missingKeywords.map((k) => (
                <span
                  key={k}
                  className="sp-label rounded-[var(--radius-pill)] px-3 py-1.5"
                  style={{ background: "var(--white)", color: "var(--flame-600)" }}
                >
                  {k}
                </span>
              ))}
            </div>
          ) : null}
          <span className="sp-body sp-body--small">{t("missingLabel")}</span>
        </div>
      ) : null}

      <FindingsList
        items={findings}
        title={t("sp.findingsTitle")}
        countLabel={ts("checksCount", counts)}
      />

      <p className="sp-body sp-body--small">{t("disclaimer")}</p>
      <ShareMark href="/ats-check" note={ts("shareMark")} />
    </Card>
  ) : (
    <Card>
      <EmptyStance
        title={t("sp.emptyTitle")}
        body={t("sp.emptyBody")}
        items={[
          t("sp.emptyList.contact"), t("sp.emptyList.headings"), t("sp.emptyList.dates"),
          t("sp.emptyList.bullets"), t("sp.emptyList.column"), t("sp.emptyList.length"),
        ]}
      />
    </Card>
  );

  return (
    <>
      <TwoCol inputs={inputs} output={output} />
      {has ? <StickyResult label={t("sp.stickyLabel")} value={`${report.score} / 100`} cta={ts("fullResult")} /> : null}
    </>
  );
}
