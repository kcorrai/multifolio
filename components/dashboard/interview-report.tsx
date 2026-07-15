"use client";

// Sahte-mülakat oturum raporu (oturum sonu + geçmiş görüntüleme ortak). SAF UI: verilen
// soru kayıtlarından genel skor halkası + tekrarlanan güç/gelişim temaları + soru bazlı döküm.
// Skor hesabı lib/interview/report.ts (saf) — burada yalnız render.
import { useTranslations } from "next-intl";
import { ThumbsUp, AlertTriangle, Trophy } from "lucide-react";
import { buildSessionReport } from "@/lib/interview/report";
import type { InterviewQuestionRecord } from "@/lib/validation/schemas/mock-interview";

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function ringColor(n: number) {
  if (n >= 70) return "#10b981";
  if (n >= 40) return "#f59e0b";
  return "#ef4444";
}

export function InterviewReport({ questions }: { questions: InterviewQuestionRecord[] }) {
  const t = useTranslations("mockInterview");
  const report = buildSessionReport(questions);
  const score = report.overallScore;

  return (
    <div className="space-y-5">
      {/* Genel skor halkası */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("report.overall")}</p>
        {score === null ? (
          <p className="text-sm text-muted-foreground">{t("report.noAnswers")}</p>
        ) : (
          <>
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/40" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke={ringColor(score)} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold tabular-nums ${scoreColor(score)}`}>{score}</span>
                <span className="text-[11px] text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("report.answered", { count: report.answeredCount, total: report.totalCount })}</p>
          </>
        )}
      </div>

      {/* Tema özetleri */}
      <div className="grid gap-4 sm:grid-cols-2">
        {report.topStrengths.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5" />{t("report.strengthsTitle")}
            </p>
            <ul className="space-y-1">
              {report.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 shrink-0" /><span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.topImprovements.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />{t("report.improvementsTitle")}
            </p>
            <ul className="space-y-1">
              {report.topImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 rounded-full bg-amber-400 shrink-0" /><span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Soru bazlı döküm */}
      <div className="space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" />{t("report.breakdown")}
        </p>
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-600 dark:text-violet-400">
              {t(`category.${q.category}`)}
            </span>
            <p className="flex-1 text-xs leading-snug">{q.question}</p>
            {q.score !== null ? (
              <span className={`shrink-0 text-sm font-bold tabular-nums ${scoreColor(q.score)}`}>{q.score}</span>
            ) : (
              <span className="shrink-0 text-[11px] text-muted-foreground/60">{t("report.unanswered")}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
