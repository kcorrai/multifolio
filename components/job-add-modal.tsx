"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus, Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDashboard } from "./dashboard/dashboard-context";
import type { JobStatus, JobMatchResult } from "@/lib/validation/schemas/job";

interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
}

interface Props {
  hasProfile: boolean;
  onClose: () => void;
  onJobAdded: (job: JobRow) => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
}

const PLATFORM_OPTIONS = ["Upwork", "Fiverr", "Bionluk", "Armut", "LinkedIn", "Diğer"];

export function JobAddModal({ hasProfile, onClose, onJobAdded, onCreditsUpdate }: Props) {
  const t = useTranslations("jobs.add");
  const { triggerComingSoon } = useDashboard();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [referred, setReferred] = useState(false);
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
        referred: referred || undefined,
      }),
    });
    const createBody = await createRes.json().catch(() => null);
    if (!createRes.ok) {
      setError(createBody?.error?.message ?? t("createError"));
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
        if (matchBody.credits) onCreditsUpdate?.(matchBody.credits);
      } else {
        // İlan oluşturuldu ama eşleştirme başarısız (402=yetersiz kredi ya da başka hata).
        // Kullanıcıyı bilgilendir ve modalı kapatma; ilan zaten listeye eklendi, elle eşleştirilebilir.
        if (matchRes.status === 402) triggerComingSoon(); // yetersiz kredi → "Kredi al" nudge
        setError(matchBody?.error?.message ?? t("matchError"));
        setStep("idle");
        return;
      }
    }

    setStep("done");
    onClose();
  }

  const stepLabel = step === "creating" ? t("creating") : step === "matching" ? t("matching") : t("submit");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#00F0FF]" />
            <h2 className="font-semibold text-sm">{t("title")}</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="job-title">{t("jobTitle")} *</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("jobTitlePlaceholder")}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-platform">{t("platform")}</Label>
              <div className="relative">
                <select
                  id="job-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={loading}
                  className="w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/30 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">{t("select")}</option>
                  {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p === "Diğer" ? t("other") : p}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-budget">{t("budget")}</Label>
              <Input
                id="job-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t("budgetPlaceholder")}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-description">
              {t("description")} *
              {hasProfile && <span className="ml-2 text-xs text-[#00F0FF] font-normal">{t("aiRequired")}</span>}
            </Label>
            <Textarea
              id="job-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="resize-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-url">{t("url")}</Label>
            <Input
              id="job-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={referred}
              onChange={(e) => setReferred(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-border accent-[#00F0FF] cursor-pointer"
            />
            <span>{t("referredLabel")}</span>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {step === "matching" && (
            <p className="text-xs text-[#00F0FF] flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin" />
              {t("matchingHint")}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={submit}
              disabled={loading || !title.trim() || !description.trim()}
              className="gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? stepLabel : t("submit")}
              {!loading && <CreditCost kind="job_match" />}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={loading}>{t("cancel")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
