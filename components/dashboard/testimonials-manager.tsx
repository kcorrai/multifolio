"use client";

// Portfolyo testimonial yönetimi: paylaşılabilir "yorum topla" linki + bekleyen
// yorumları onayla/reddet + onaylıları göster. Onaylılar public portfolyoda görünür.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Copy, MessageSquareQuote } from "lucide-react";
import type { TestimonialRow } from "@/lib/validation/schemas/testimonial";

export function TestimonialsManager({ slug, published }: { slug: string; published: boolean }) {
  const t = useTranslations("portfolio.testimonials");
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((b) => setItems(b.testimonials ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/testimonials", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    setItems((prev) => status === "rejected"
      ? prev.filter((i) => i.id !== id)
      : prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}/recommend`;
  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="h-4 w-4 text-[#00F0FF]" />
        <h3 className="text-sm font-bold">{t("title")}</h3>
      </div>

      {!published ? (
        <p className="text-xs text-muted-foreground">{t("publishFirst")}</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t("shareHint")}</p>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground" />
              <button
                onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground">{t("loading")}</p>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">{t("pending", { count: pending.length })}</p>
                  {pending.map((tm) => (
                    <div key={tm.id} className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2">
                      <p className="text-sm leading-relaxed">“{tm.quote}”</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{tm.author_name}{tm.author_role ? ` · ${tm.author_role}` : ""}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => setStatus(tm.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors cursor-pointer">
                            <Check className="h-3 w-3" />{t("approve")}
                          </button>
                          <button onClick={() => setStatus(tm.id, "rejected")} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                            <X className="h-3 w-3" />{t("reject")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {approved.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{t("approved", { count: approved.length })}</p>
                  {approved.map((tm) => (
                    <div key={tm.id} className="flex items-start justify-between gap-2 rounded-xl border border-border p-3">
                      <div>
                        <p className="text-sm leading-relaxed">“{tm.quote}”</p>
                        <span className="text-xs text-muted-foreground">{tm.author_name}{tm.author_role ? ` · ${tm.author_role}` : ""}</span>
                      </div>
                      <button onClick={() => setStatus(tm.id, "rejected")} title={t("remove")} aria-label={t("remove")} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pending.length === 0 && approved.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("empty")}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
