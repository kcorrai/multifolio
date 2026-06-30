"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Copy, Check, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { ProposalRow } from "@/lib/validation/schemas/proposal";

interface Props {
  jobId: string;
  jobDescription: string;
  defaultPlatform?: string;
  onClose: () => void;
  onCostUpdate?: (usd: number) => void;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

export function ProposalModal({ jobId, jobDescription, defaultPlatform, onClose, onCostUpdate }: Props) {
  const validDefault = PLATFORM_IDS.includes(defaultPlatform as PlatformId) ? defaultPlatform as PlatformId : "upwork";
  const [platform, setPlatform] = useState<PlatformId>(validDefault);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch(`/api/proposal?job_id=${jobId}`)
      .then((r) => r.json())
      .then((b) => setProposals(b.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [jobId]);

  async function generate() {
    setGenerating(true); setError("");
    const res = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, platform, job_description: jobDescription }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "Teklif üretilemedi.");
      setGenerating(false); return;
    }
    const newProposal = body.proposal as ProposalRow;
    setGenerated(newProposal.content);
    setProposals((prev) => [newProposal, ...prev]);
    if (typeof body.cost?.usd === "number") onCostUpdate?.(body.cost.usd);
    setGenerating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F0FF]" />
            <h2 className="font-semibold text-sm">Teklif Oluştur</h2>
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
            <Button onClick={generate} disabled={generating || !jobDescription} className="gap-2 shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Oluşturuluyor…" : "Oluştur"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">{error}</p>
          )}

          {/* Yeni oluşturulan teklif */}
          {generated && (
            <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#00F0FF]">Yeni Teklif — {PLATFORMS[platform].label}</span>
                <CopyBtn text={generated} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{generated}</p>
            </div>
          )}

          {/* Geçmiş teklifler */}
          {!loadingHistory && proposals.filter((p) => p.content !== generated).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />Önceki teklifler
              </p>
              {proposals
                .filter((p) => p.content !== generated)
                .map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {PLATFORMS[p.platform as PlatformId]?.label ?? p.platform} ·{" "}
                        {new Date(p.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      <CopyBtn text={p.content} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{p.content}</p>
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
