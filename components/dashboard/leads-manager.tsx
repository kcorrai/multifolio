"use client";

// Portfolyo "gelen talepler" yönetimi: public portfolyodan gelen lead'leri listeler,
// durumunu (new/contacted/converted/archived) günceller, e-posta ile yanıtlamayı kolaylaştırır.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Inbox, Mail } from "lucide-react";
import type { LeadRow, LeadStatus } from "@/lib/validation/schemas/lead";

const STATUS_ORDER: LeadStatus[] = ["new", "contacted", "converted", "archived"];
const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00c2cc] dark:text-[#00F0FF]",
  contacted: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  converted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "border-border bg-muted/50 text-muted-foreground",
};

export function LeadsManager() {
  const t = useTranslations("portfolio.leads");
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio-leads")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (b) setItems(b.leads ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: LeadStatus) {
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch("/api/portfolio-leads", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }),
    }).catch(() => {});
  }

  const newCount = items.filter((l) => l.status === "new").length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Inbox className="h-4 w-4 text-[#00F0FF]" />
        <h3 className="text-sm font-bold">{t("title")}</h3>
        {newCount > 0 && (
          <span className="ml-auto rounded-full bg-[#00F0FF] px-2 py-0.5 text-[10px] font-bold text-[#090A0F] tabular-nums">
            {t("newBadge", { count: newCount })}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{l.name}</p>
                  <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-[11px] text-[#00c2cc] dark:text-[#00F0FF] hover:underline">
                    <Mail className="h-3 w-3" />{l.email}
                  </a>
                </div>
                <select
                  aria-label={t("statusLabel")}
                  value={l.status}
                  onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer ${STATUS_STYLE[l.status]}`}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{t(`status.${s}`)}</option>
                  ))}
                </select>
              </div>

              {(l.project_type || l.budget || l.timeline) && (
                <div className="flex flex-wrap gap-1.5">
                  {[l.project_type, l.budget, l.timeline].filter(Boolean).map((x, i) => (
                    <span key={i} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{x}</span>
                  ))}
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-4">{l.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
