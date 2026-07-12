"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Sparkles, Copy, Check, ChevronDown, Clock, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { PLATFORMS, PLATFORM_IDS, PLATFORM_LANGUAGE, type PlatformId } from "@/lib/ai/platforms";
import { PROPOSAL_TONES, PROPOSAL_LENGTHS, type ProposalTone, type ProposalLength } from "@/lib/proposal/style";
import { pendingRequirements, coverageSummary } from "@/lib/ai/coverage";
import { HealthWarnings } from "./dashboard/health-warnings";
import { ProposalQualityBadge } from "./proposal-quality";
import { useDashboard } from "./dashboard/dashboard-context";
import type { ProposalRow, ProposalCoverageItem } from "@/lib/validation/schemas/proposal";

interface Props {
  jobId: string;
  jobDescription: string;
  defaultPlatform?: string;
  onClose: () => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
  // Açılışta teklifi otomatik üret (asistanlı 1-tık başvuru akışı) — kredi harcar.
  autoGenerate?: boolean;
}

function CopyBtn({ text }: { text: string }) {
  const t = useTranslations("proposal");
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t("modal.copied") : t("modal.copy")}
    </button>
  );
}

// Teklif dili UI dilinden farklıysa (TR kullanıcı × EN platform) on-demand
// çeviri toggle'ı: ücretsiz, POST /api/proposal/[id]/translate; sonuç state'te
// tutulur (tekrar tıklamada API'ye gidilmez). Çeviri yalnız KONTROL içindir —
// platforma orijinal metin gönderilir.
function TranslationBlock({ proposalId, platform }: { proposalId: string; platform: string }) {
  const t = useTranslations("proposal");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const contentLang = PLATFORM_LANGUAGE[platform as PlatformId] ?? "en";
  if (contentLang === locale) return null;

  async function toggle() {
    if (text) { setShow((s) => !s); return; }
    setBusy(true); setError("");
    const res = await fetch(`/api/proposal/${proposalId}/translate`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.content) {
      setText(body.content as string);
      setShow(true);
    } else {
      setError(body?.error?.message ?? t("modal.translateError"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={toggle}
        disabled={busy}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-60"
      >
        <Languages className="h-3 w-3" />
        {busy ? t("modal.translating") : show ? t("modal.hideTranslation") : t("modal.showTranslation")}
      </button>
      {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      {show && text && (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1">
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
          <p className="text-[10px] text-muted-foreground/70">{t("modal.translationNote")}</p>
        </div>
      )}
    </div>
  );
}

export function ProposalModal({ jobId, jobDescription, defaultPlatform, onClose, onCreditsUpdate, autoGenerate = false }: Props) {
  const t = useTranslations("proposal");
  const locale = useLocale();
  const { triggerComingSoon } = useDashboard();
  const validDefault = PLATFORM_IDS.includes(defaultPlatform as PlatformId) ? defaultPlatform as PlatformId : "upwork";
  const [platform, setPlatform] = useState<PlatformId>(validDefault);
  const [tone, setTone] = useState<ProposalTone>("professional");
  const [length, setLength] = useState<ProposalLength>("standard");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [coverage, setCoverage] = useState<ProposalCoverageItem[]>([]);

  useEffect(() => {
    fetch(`/api/proposal?job_id=${jobId}`)
      .then((r) => r.json())
      .then((b) => setProposals(b.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [jobId]);

  // A11y: Escape kapatır + açıkken arka plan kaydırması kilitlenir (mobile-nav deseni).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function generate(focus?: string[]) {
    setGenerating(true); setError("");
    const res = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        platform,
        job_description: jobDescription,
        tone,
        length,
        ...(focus?.length ? { focus_requirements: focus } : {}),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("modal.generateError"));
      if (res.status === 402) triggerComingSoon(); // yetersiz kredi → "Kredi al" nudge
      setGenerating(false); return;
    }
    const newProposal = body.proposal as ProposalRow;
    setGenerated(newProposal.content);
    setGeneratedId(newProposal.id);
    setCoverage(newProposal.coverage ?? []);
    setProposals((prev) => [newProposal, ...prev]);
    if (body.credits) onCreditsUpdate?.(body.credits);
    setGenerating(false);
  }

  // Asistanlı 1-tık başvuru: açılışta bir kez otomatik üret (ref ile mükerrer önlenir).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoGenerate && !autoRan.current && jobDescription) {
      autoRan.current = true;
      void generate();
    }
    // generate closure'ı state setter'larına bağlı; yalnız açılışta bir kez tetiklenmeli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, jobDescription]);

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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F0FF]" />
            <h2 className="font-semibold text-sm">{t("modal.title")}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Platform seçimi + Generate */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="w-full appearance-none rounded-xl border border-border bg-muted/40 px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 cursor-pointer"
              >
                {PLATFORM_IDS.map((p) => (
                  <option key={p} value={p}>{PLATFORMS[p].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <Button onClick={() => generate()} disabled={generating || !jobDescription} className="gap-2 shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? t("modal.generating") : t("modal.generate")}
              <CreditCost kind="proposal" />
            </Button>
          </div>

          {/* Yazım stili: ton + uzunluk (AI slop'u azaltır) */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">{t("modal.tone")}</span>
              <div className="relative">
                <select value={tone} onChange={(e) => setTone(e.target.value as ProposalTone)}
                  className="w-full appearance-none rounded-xl border border-border bg-muted/40 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 cursor-pointer">
                  {PROPOSAL_TONES.map((tn) => <option key={tn} value={tn}>{t(`modal.tones.${tn}`)}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">{t("modal.length")}</span>
              <div className="relative">
                <select value={length} onChange={(e) => setLength(e.target.value as ProposalLength)}
                  className="w-full appearance-none rounded-xl border border-border bg-muted/40 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 cursor-pointer">
                  {PROPOSAL_LENGTHS.map((ln) => <option key={ln} value={ln}>{t(`modal.lengths.${ln}`)}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">{error}</p>
          )}

          {/* Yeni oluşturulan teklif */}
          {generated && (
            <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#00F0FF]">{t("modal.newProposal", { platform: PLATFORMS[platform].label })}</span>
                <CopyBtn text={generated} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{generated}</p>
              <div className="pt-2 border-t border-[#00F0FF]/15">
                <ProposalQualityBadge text={generated} length={length} />
              </div>
              <HealthWarnings text={generated} platform={platform} />
              {generatedId && <TranslationBlock key={generatedId} proposalId={generatedId} platform={platform} />}
              {coverage.length > 0 && (
                <div className="pt-3 mt-1 border-t border-[#00F0FF]/15 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("modal.coverageSummary", { met: coverageSummary(coverage).met, total: coverageSummary(coverage).total })}
                  </p>
                  <ul className="space-y-1.5">
                    {coverage.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px]">
                        <span
                          className={
                            c.status === "met"
                              ? "text-green-600 dark:text-green-400"
                              : c.status === "partial"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {c.status === "met" ? "✓" : c.status === "partial" ? "~" : "✕"}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{c.requirement}</span>
                          {c.note ? ` — ${c.note}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {pendingRequirements(coverage).length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => generate(pendingRequirements(coverage))}
                      disabled={generating}
                      className="w-full gap-2 mt-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {generating ? t("modal.generating") : t("modal.fixGaps")}
                      <CreditCost kind="proposal" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Geçmiş teklifler */}
          {!loadingHistory && proposals.filter((p) => p.content !== generated).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />{t("modal.previousProposals")}
              </p>
              {proposals
                .filter((p) => p.content !== generated)
                .map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {PLATFORMS[p.platform as PlatformId]?.label ?? p.platform} ·{" "}
                        {new Date(p.created_at).toLocaleDateString(locale)}
                        {p.coverage && p.coverage.length > 0 && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground/70">
                            · {t("modal.coverageShort", { met: coverageSummary(p.coverage).met, total: coverageSummary(p.coverage).total })}
                          </span>
                        )}
                      </span>
                      <CopyBtn text={p.content} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{p.content}</p>
                    <HealthWarnings text={p.content} platform={p.platform as PlatformId} />
                    <TranslationBlock proposalId={p.id} platform={p.platform} />
                  </div>
                ))}
            </div>
          )}

          {loadingHistory && (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 rounded-full border-2 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
