"use client";

// Teklif denetçisi formu: tamamen istemcide, canlı puan (AI/API yok). Kullanıcı
// teklif metnini yapıştırır → kazanan-teklif kriterlerine göre 0-100 skor + kontrol
// listesi + klişe uyarıları + signup CTA (analyze/earnings deseni).
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, X, Info, ArrowRight, ClipboardCheck } from "lucide-react";
import { checkProposal, type CheckId } from "@/lib/proposal-check/checker";

const CHECK_ORDER: CheckId[] = ["length", "question", "numbers", "clientFocus", "noFiller"];

export function ProposalChecker({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("proposalChecker");
  const [text, setText] = useState("");
  const report = useMemo(() => checkProposal(text), [text]);
  const has = text.trim().length > 0;

  const ringColor = report.verdict === "strong" ? "#22c55e" : report.verdict === "ok" ? "#00F0FF" : "#f59e0b";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Girdi */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <label htmlFor="proposal-text" className="text-xs font-semibold text-muted-foreground">{t("inputLabel")}</label>
        <textarea
          id="proposal-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder={t("placeholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40"
        />
        <p className="text-[11px] text-muted-foreground/70">{t("wordCount", { count: report.wordCount })}</p>
      </div>

      {/* Sonuç */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00F0FF] flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />{t("resultTitle")}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums" style={{ color: has ? ringColor : undefined }}>
              {has ? report.score : "—"}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {has && (
              <span className="ml-auto text-xs font-bold uppercase tracking-wide" style={{ color: ringColor }}>
                {t(`verdict.${report.verdict}`)}
              </span>
            )}
          </div>

          {/* Kontrol listesi */}
          <div className="space-y-2 pt-1 border-t border-[#00F0FF]/15">
            {CHECK_ORDER.map((id) => {
              const c = report.checks.find((x) => x.id === id)!;
              const ok = has && c.passed;
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
          </div>

          {/* Klişe uyarıları */}
          {report.fillerFound.length > 0 && (
            <div className="pt-2 border-t border-[#00F0FF]/15 space-y-1.5">
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{t("fillerLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {report.fillerFound.map((f) => (
                  <span key={f} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    {f}
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
