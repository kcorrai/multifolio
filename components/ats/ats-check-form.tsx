"use client";

// CV/ATS denetleyici formu: tamamen istemcide, canlı skor (AI/API/kredi YOK).
// CV metnini yapıştır (+ opsiyonel ilan metni) → 0-100 ATS skoru + kontrol listesi +
// eksik anahtar kelimeler + signup CTA (headline-optimizer/analyze deseni). Metin
// SUNUCUYA GİTMEZ (gizlilik: tarayıcıda hesaplanır, saklanmaz).
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, X, Info, ArrowRight, Sparkles, ShieldCheck, Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { scoreResumeText, type ResumeCheckId } from "@/lib/cv/ats-text";

const CHECK_ORDER: ResumeCheckId[] = [
  "contact", "summary", "skills", "experience", "education",
  "quantified", "noFiller", "dates", "length", "keywords",
];

export function AtsCheckForm({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("atsCheck");
  const [cv, setCv] = useState("");
  const [job, setJob] = useState("");
  const report = useMemo(() => scoreResumeText(cv, job), [cv, job]);
  const has = cv.trim().length > 0;

  const color = report.verdict === "strong" ? "#22c55e" : report.verdict === "average" ? "#00F0FF" : "#f59e0b";
  const checks = CHECK_ORDER.map((id) => report.checks.find((c) => c.id === id)).filter(Boolean) as { id: ResumeCheckId; passed: boolean }[];
  // Teaser: kayıtsız kullanıcıya skor + ilk 3 kontrol ücretsiz; kalan kontroller +
  // anahtar-kelime eşleşmesi giriş arkasında. Metin YİNE sunucuya gitmez — yalnız UI
  // gizlenir (gizlilik korunur). Girişli kullanıcı tam raporu görür.
  const FREE_CHECKS = 3;
  const locked = !isLoggedIn && has;
  const visibleChecks = locked ? checks.slice(0, FREE_CHECKS) : checks;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Girdi */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <label htmlFor="cv" className="text-xs font-semibold text-muted-foreground">{t("cvLabel")}</label>
          <Textarea
            id="cv"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder={t("cvPlaceholder")}
            rows={12}
            className="resize-none text-sm leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground/70">{t("wordCount", { count: report.wordCount })}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <label htmlFor="job" className="text-xs font-semibold text-muted-foreground">{t("jobLabel")}</label>
          <Textarea
            id="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder={t("jobPlaceholder")}
            rows={4}
            className="resize-none text-sm leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground/70">{t("jobHint")}</p>
        </div>
        <p className="flex items-start gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {t("privacy")}
        </p>
      </div>

      {/* Sonuç */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00F0FF] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />{t("resultTitle")}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums" style={{ color: has ? color : undefined }}>
              {has ? report.score : "—"}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {has && (
              <span className="ml-auto text-xs font-bold uppercase tracking-wide" style={{ color }}>
                {t(`verdict.${report.verdict}`)}
              </span>
            )}
          </div>

          {report.keywordCoverage !== null && has && (
            <div className="rounded-xl border border-[#00F0FF]/15 bg-background/40 px-3 py-2">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {t("keywordCoverage", { pct: report.keywordCoverage })}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-[#00F0FF]/15">
            {visibleChecks.map(({ id, passed }) => {
              const ok = has && passed;
              return (
                <div key={id} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    ok ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400" : "bg-muted text-muted-foreground/50"
                  }`}>
                    {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className={ok ? "text-foreground" : "text-muted-foreground"}>{t(`checks.${id}`)}</span>
                </div>
              );
            })}
            {locked && (
              <div className="mt-1 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.05] px-3 py-3 text-center space-y-2">
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold">
                  <Lock className="h-3.5 w-3.5 text-violet-500" />
                  {t("teaser.lockChecks", { count: checks.length - FREE_CHECKS })}
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3 py-1.5 transition-colors"
                >
                  {t("teaser.unlock")}<ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {!locked && has && report.missingKeywords.length > 0 && (
            <div className="pt-2 border-t border-[#00F0FF]/15 space-y-1.5">
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{t("missingLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {report.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {t("disclaimer")}
        </p>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2">
          <p className="text-sm font-semibold">{t("ctaTitle")}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("ctaBody")}</p>
          <Link
            href={isLoggedIn ? "/dashboard/cv" : "/signup"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 transition-colors"
          >
            {isLoggedIn ? t("ctaButtonIn") : t("ctaButton")}<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
