"use client";

// Geçmiş sahte-mülakat oturumları listesi (ilerleme takibi). Tamamlanan oturuma tıklayınca
// raporu yeniden açar. Veri /api/interview/sessions'tan gelir (tam questions jsonb'siyle).
import { useLocale, useTranslations } from "next-intl";
import { History, ChevronRight } from "lucide-react";
import type { InterviewSession } from "@/lib/validation/schemas/mock-interview";

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function InterviewHistory({
  sessions, onOpen,
}: {
  sessions: InterviewSession[];
  onOpen: (session: InterviewSession) => void;
}) {
  const t = useTranslations("mockInterview");
  const locale = useLocale();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />{t("history.title")}
      </p>
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {t("history.empty")}
        </p>
      ) : (
        <div className="space-y-1.5">
          {sessions.map((s) => {
            const done = s.status === "completed";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpen(s)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">
                    {t(`difficulty.${s.difficulty}`)} · {t("history.questions", { count: s.question_count })}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(s.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {done ? t("history.completed") : t("history.inProgress")}
                  </p>
                </div>
                {done && s.overall_score !== null && (
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(s.overall_score)}`}>{s.overall_score}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
