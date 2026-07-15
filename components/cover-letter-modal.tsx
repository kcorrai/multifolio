"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, Copy, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { useDashboard } from "./dashboard/dashboard-context";

interface Props {
  jobId: string;
  jobDescription: string;
  onClose: () => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
}

export function CoverLetterModal({ jobId, jobDescription, onClose, onCreditsUpdate }: Props) {
  const t = useTranslations("coverLetter");
  const { triggerComingSoon } = useDashboard();
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function generate() {
    setBusy(true); setError("");
    const res = await fetch("/api/coverletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, job_description: jobDescription }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("error"));
      if (res.status === 402) triggerComingSoon();
      setBusy(false); return;
    }
    setContent(body.content as string);
    if (body.credits) onCreditsUpdate?.(body.credits);
    setBusy(false);
  }

  // ranRef mükerrer tetiklemeyi önler; jobId dep'te → doğru iş bağlamı garanti.
  useEffect(() => {
    if (!ranRef.current && jobDescription) {
      ranRef.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription, jobId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#00F0FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("title")}</h3>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {busy && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin" />
              <p className="text-xs text-muted-foreground">{t("generating")}</p>
            </div>
          )}
          {error && !busy && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={generate} size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />{t("retry")}<CreditCost kind="cover_letter" />
              </Button>
            </div>
          )}
          {content && !busy && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/40 border border-border p-4">{content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
