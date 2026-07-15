"use client";

// Ürün geri bildirimi sekmesi: kullanıcı Multifolio hakkında hata/öneri/genel yorum
// bırakır → POST /api/feedback (DB'ye yazılır; e-posta yok). Altında kendi geçmişi.
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send, AlertCircle, CheckCircle2, Bug, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ELEVATED } from "./shared";
import { FEEDBACK_CATEGORIES, type FeedbackCategory, type FeedbackRow } from "@/lib/validation/schemas/feedback";

const CATEGORY_ICON: Record<FeedbackCategory, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

export function FeedbackTab({ initialFeedback }: { initialFeedback: FeedbackRow[] }) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<FeedbackRow[]>(initialFeedback);

  async function submit() {
    if (message.trim().length < 3) { setError(t("tooShort")); return; }
    setSending(true); setError(""); setSent(false);
    const res = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message: message.trim() }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("errorSend")); setSending(false); return; }
    setHistory((prev) => [body.feedback, ...prev]);
    setMessage(""); setSent(true); setSending(false);
  }

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Kategori seçici */}
          <div className="space-y-2">
            <Label>{t("categoryLabel")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c];
                const selected = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors cursor-pointer ${
                      selected
                        ? "border-[#00F0FF]/60 bg-[#00F0FF]/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${selected ? "text-[#00F0FF]" : ""}`} />
                    {t(`category.${c}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mesaj */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-message">{t("messageLabel")}</Label>
            <Textarea
              id="fb-message"
              rows={6}
              value={message}
              maxLength={2000}
              onChange={(e) => { setMessage(e.target.value); setSent(false); }}
              placeholder={t("messagePlaceholder")}
              className="resize-none"
            />
            <p className="text-right text-xs text-muted-foreground/70">{message.length}/2000</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {sent && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />{t("thanks")}
            </div>
          )}

          <Button onClick={submit} disabled={sending || message.trim().length < 3} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? t("sending") : t("send")}
          </Button>
        </CardContent>
      </Card>

      {/* Geçmiş */}
      {history.length > 0 && (
        <Card className={`shadow-sm ${ELEVATED}`}>
          <CardHeader>
            <CardTitle className="text-base">{t("historyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((f) => {
              const Icon = CATEGORY_ICON[f.category];
              return (
                <div key={f.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">{t(`category.${f.category}`)}</span>
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(f.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{f.message}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
