"use client";

import { useState } from "react";
import { X, Plus, Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobStatus, JobMatchResult } from "@/lib/validation/schemas/job";

interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
}

interface Props {
  hasProfile: boolean;
  onClose: () => void;
  onJobAdded: (job: JobRow) => void;
  onCostUpdate?: (usd: number) => void;
}

const PLATFORM_OPTIONS = ["Upwork", "Fiverr", "Bionluk", "Armut", "LinkedIn", "Diğer"];

export function JobAddModal({ hasProfile, onClose, onJobAdded, onCostUpdate }: Props) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"idle" | "creating" | "matching" | "done">("idle");
  const [error, setError] = useState("");

  const loading = step === "creating" || step === "matching";

  async function submit() {
    setStep("creating"); setError("");
    const createRes = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        platform: platform || undefined,
        budget: budget.trim() || undefined,
        description: description.trim(),
        url: url.trim() || undefined,
      }),
    });
    const createBody = await createRes.json().catch(() => null);
    if (!createRes.ok) {
      setError(createBody?.error?.message ?? "İlan eklenemedi.");
      setStep("idle"); return;
    }

    const job = createBody.job as JobRow;
    onJobAdded(job);

    // Açıklama varsa ve profil mevcutsa otomatik eşleştir
    if (hasProfile && description.trim()) {
      setStep("matching");
      const matchRes = await fetch(`/api/jobs/${job.id}/match`, { method: "POST" });
      const matchBody = await matchRes.json().catch(() => null);
      if (matchRes.ok && matchBody?.job) {
        onJobAdded(matchBody.job as JobRow);
        if (typeof matchBody.cost?.usd === "number") onCostUpdate?.(matchBody.cost.usd);
      }
    }

    setStep("done");
    onClose();
  }

  const stepLabel = step === "creating" ? "İlan oluşturuluyor…" : step === "matching" ? "AI eşleştirme yapılıyor…" : "Analiz Et ve Ekle";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#00F0FF]" />
            <h2 className="font-semibold text-sm">İlan Ekle</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="job-title">İlan başlığı *</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ör. Senior React Developer"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-platform">Platform</Label>
              <div className="relative">
                <select
                  id="job-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={loading}
                  className="w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Seç…</option>
                  {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-budget">Bütçe</Label>
              <Input
                id="job-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="ör. $500–1000"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-description">
              İlan metni *
              {hasProfile && <span className="ml-2 text-[11px] text-[#00F0FF] font-normal">AI eşleştirme için gerekli</span>}
            </Label>
            <Textarea
              id="job-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İlanın tam metnini yapıştır…"
              className="resize-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-url">İlan URL&apos;si</Label>
            <Input
              id="job-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {step === "matching" && (
            <p className="text-xs text-[#00F0FF] flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin" />
              Profil ve ilan eşleştiriliyor…
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={submit}
              disabled={loading || !title.trim() || !description.trim()}
              className="gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? stepLabel : "Analiz Et ve Ekle"}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={loading}>İptal</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
