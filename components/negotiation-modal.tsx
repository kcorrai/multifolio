"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, Copy, Check, Handshake, TrendingUp, MessageSquare, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { useDashboard } from "./dashboard/dashboard-context";
import type { Negotiation } from "@/lib/validation/schemas/negotiation";

interface Props {
  jobId: string;
  onClose: () => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
}

function CopyBtn({ text }: { text: string }) {
  const t = useTranslations("negotiation");
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

export function NegotiationModal({ jobId, onClose, onCreditsUpdate }: Props) {
  const t = useTranslations("negotiation");
  const { triggerComingSoon } = useDashboard();
  const [offer, setOffer] = useState("");
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<Negotiation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function generate() {
    if (!offer.trim()) return;
    setBusy(true); setError("");
    const res = await fetch("/api/negotiation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, offer, ...(target.trim() ? { target } : {}) }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("error"));
      if (res.status === 402) triggerComingSoon();
      setBusy(false); return;
    }
    setResult(body.negotiation as Negotiation);
    if (body.credits) onCreditsUpdate?.(body.credits);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Handshake className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("title")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!result ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t("offerLabel")}</label>
                <Textarea value={offer} onChange={(e) => setOffer(e.target.value)} placeholder={t("offerPlaceholder")} rows={3} className="resize-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t("targetLabel")}</label>
                <Textarea value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t("targetPlaceholder")} rows={2} className="resize-none text-sm" />
              </div>
              <Button onClick={generate} disabled={busy || !offer.trim()} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? t("generating") : t("generate")}
                <CreditCost kind="negotiation" />
              </Button>
              {error && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
            </>
          ) : (
            <>
              {/* Değerlendirme */}
              <section className="space-y-1.5">
                <h4 className="text-xs font-bold">{t("assessment")}</h4>
                <p className="text-xs leading-relaxed rounded-xl bg-muted/40 border border-border p-3">{result.assessment}</p>
              </section>

              {/* Karşı-teklif */}
              <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-3 space-y-1.5">
                <h4 className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-3.5 w-3.5" />{t("counter")}</h4>
                <p className="text-sm font-extrabold">{result.counterOffer.range}</p>
                <p className="text-[11px]"><span className="font-semibold text-muted-foreground">{t("anchor")}:</span> {result.counterOffer.anchor}</p>
                <p className="text-[11px] text-muted-foreground">{result.counterOffer.rationale}</p>
              </section>

              {/* Strateji */}
              {result.strategy.length > 0 && (
                <section className="space-y-1.5">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" />{t("strategy")}</h4>
                  <ul className="space-y-1">{result.strategy.map((s, i) => <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5"><span className="text-amber-500">·</span><span>{s}</span></li>)}</ul>
                </section>
              )}

              {/* Konuşma noktaları */}
              {result.talkingPoints.length > 0 && (
                <section className="space-y-1.5">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-[#00F0FF]" />{t("talkingPoints")}</h4>
                  <ul className="space-y-1">{result.talkingPoints.map((s, i) => <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5"><span className="text-[#00F0FF]">·</span><span>{s}</span></li>)}</ul>
                </section>
              )}

              {/* Hazır e-posta */}
              <section className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-violet-500" />{t("email")}</h4>
                  <CopyBtn text={result.email} />
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/40 border border-border p-3">{result.email}</p>
              </section>

              <button onClick={() => setResult(null)} className="text-[11px] text-muted-foreground hover:text-foreground underline">{t("redo")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
