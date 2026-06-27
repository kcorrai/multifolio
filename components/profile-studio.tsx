"use client";

import { useState } from "react";
import {
  User, Layers, Globe, Briefcase, Save, Sparkles, Target,
  Trash2, Plus, X, ExternalLink, CheckCircle2, AlertCircle, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import { JOB_STATUSES, type JobStatus, type JobMatchResult } from "@/lib/validation/schemas/job";

/* ── Types ──────────────────────────────────────────────────────────── */

interface InitialProfile {
  headline: string;
  summary: string;
  skills: string[];
}

interface InitialPortfolio {
  slug: string;
  published: boolean;
  content: PortfolioContent | null;
}

interface AdaptOutput {
  headline: string;
  body: string;
}

interface JobRow {
  id: string;
  title: string;
  company: string | null;
  platform: string | null;
  status: JobStatus;
  match_score: number | null;
  match_result: JobMatchResult | null;
  created_at: string;
}

interface AnalyticsData {
  totalUsd: number;
  totalCount: number;
  byKind: Record<string, { count: number; costUsd: number }>;
  dailySeries: { date: string; costUsd: number }[];
}

type Tab = "profil" | "uyarlama" | "portfolyo" | "ilanlar" | "analitik";

/* ── Constants ──────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Kaydedildi",
  applied: "Başvuruldu",
  interview: "Görüşme",
  offer: "Teklif",
  rejected: "Reddedildi",
};

const STATUS_CLASSES: Record<JobStatus, string> = {
  saved:     "bg-slate-100 text-slate-600",
  applied:   "bg-blue-50 text-blue-700",
  interview: "bg-amber-50 text-amber-700",
  offer:     "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
};

function scoreColor(n: number) {
  if (n >= 70) return "bg-green-50 text-green-700 ring-1 ring-green-200";
  if (n >= 40) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-red-50 text-red-600 ring-1 ring-red-200";
}

function formatUsd(n: number) {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function ProfileStudio({
  initialProfile,
  initialSpendUsd,
  initialPortfolio,
  initialJobs,
  initialAnalytics,
}: {
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
  initialPortfolio: InitialPortfolio | null;
  initialJobs: JobRow[];
  initialAnalytics: AnalyticsData;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  /* — Profile state — */
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialProfile !== null ? "saved" : "idle",
  );
  const [profileError, setProfileError] = useState("");

  /* — Spend — */
  const [spend, setSpend] = useState(initialSpendUsd);

  /* — Adaptation state — */
  const [results, setResults] = useState<Partial<Record<PlatformId, AdaptOutput>>>({});
  const [adapting, setAdapting] = useState<PlatformId | null>(null);
  const [adaptError, setAdaptError] = useState("");

  /* — Portfolio state — */
  const [portfolio, setPortfolio] = useState<InitialPortfolio | null>(initialPortfolio);
  const [portfolioSlug, setPortfolioSlug] = useState(initialPortfolio?.slug ?? "");
  const [portfolioPublished, setPortfolioPublished] = useState(initialPortfolio?.published ?? false);
  const [generating, setGenerating] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");

  /* — Jobs state — */
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addPlatform, setAddPlatform] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [jobError, setJobError] = useState("");

  /* — Handlers — */

  async function saveProfile() {
    setSaveState("saving");
    setProfileError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline,
        summary,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSaveState("error");
      setProfileError(body?.error?.message ?? "Profil kaydedilemedi.");
      return;
    }
    setSaveState("saved");
  }

  async function adapt(platform: PlatformId) {
    setAdapting(platform);
    setAdaptError("");
    const res = await fetch("/api/adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setAdaptError(body?.error?.message ?? "Uyarlama başarısız.");
      setAdapting(null);
      return;
    }
    setResults((prev) => ({ ...prev, [platform]: body.output }));
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setAdapting(null);
  }

  async function generatePortfolio() {
    setGenerating(true);
    setPortfolioError("");
    const res = await fetch("/api/portfolio/generate", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setPortfolioError(body?.error?.message ?? "Portfolyo üretilemedi.");
      setGenerating(false);
      return;
    }
    const p = body.portfolio;
    setPortfolio({ slug: p.slug, published: p.published, content: p.content });
    setPortfolioSlug(p.slug);
    setPortfolioPublished(p.published);
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setGenerating(false);
  }

  async function savePortfolioSettings() {
    setSavingPortfolio(true);
    setPortfolioError("");
    const res = await fetch("/api/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: portfolioSlug, published: portfolioPublished }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setPortfolioError(body?.error?.message ?? "Ayarlar kaydedilemedi.");
      setSavingPortfolio(false);
      return;
    }
    setPortfolio((prev) =>
      prev ? { ...prev, slug: body.portfolio.slug, published: body.portfolio.published } : null,
    );
    setSavingPortfolio(false);
  }

  async function addJob() {
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: addTitle,
        company: addCompany || undefined,
        platform: addPlatform || undefined,
        description: addDescription,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setAddError(body?.error?.message ?? "İlan eklenemedi.");
      setAdding(false);
      return;
    }
    setJobs((prev) => [body.job as JobRow, ...prev]);
    setAddTitle("");
    setAddCompany("");
    setAddPlatform("");
    setAddDescription("");
    setAddFormOpen(false);
    setAdding(false);
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    setJobError("");
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setJobError(body?.error?.message ?? "Durum güncellenemedi.");
      return;
    }
    setJobs((prev) => prev.map((j) => (j.id === id ? (body.job as JobRow) : j)));
  }

  async function matchJob(id: string) {
    setMatchingId(id);
    setJobError("");
    const res = await fetch(`/api/jobs/${id}/match`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setJobError(body?.error?.message ?? "Eşleştirme başarısız.");
      setMatchingId(null);
      return;
    }
    setJobs((prev) => prev.map((j) => (j.id === id ? (body.job as JobRow) : j)));
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setMatchingId(null);
  }

  async function deleteJob(id: string) {
    setDeletingId(id);
    setJobError("");
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setJobError(body?.error?.message ?? "İlan silinemedi.");
      setDeletingId(null);
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingId(null);
  }

  /* — Tabs config — */
  const KIND_LABELS: Record<string, string> = {
    adaptation: "Platform Uyarlama",
    portfolio_generation: "Portfolyo Üretimi",
    job_match: "İlan Eşleştirme",
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "profil",    label: "Profil",           icon: User },
    { id: "uyarlama",  label: "Platform Uyarlama", icon: Layers },
    { id: "portfolyo", label: "Portfolyo",         icon: Globe },
    { id: "ilanlar",   label: "İlanlar",           icon: Briefcase, badge: jobs.length || undefined },
    { id: "analitik",  label: "Analitik",          icon: BarChart3 },
  ];

  const profileSaved = saveState === "saved";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil Stüdyosu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Profilini yönet, platformlara uyarla ve ilanları takip et.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-xs text-muted-foreground">AI harcama</span>
          <span className="text-sm font-semibold tabular-nums">{formatUsd(spend)}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            {badge !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                activeTab === id ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Profil sekmesi ── */}
      {activeTab === "profil" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Çekirdek Profil</CardTitle>
            <CardDescription>
              Bu bilgiler tüm platformlara ve portfolyona temel oluşturur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="headline">Başlık</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => { setHeadline(e.target.value); setSaveState("idle"); }}
                placeholder="ör. Senior Frontend Developer · React & TypeScript"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Özet</Label>
              <Textarea
                id="summary"
                rows={5}
                value={summary}
                onChange={(e) => { setSummary(e.target.value); setSaveState("idle"); }}
                placeholder="Deneyimini, uzmanlığını ve öne çıkan sonuçları kısaca anlat."
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skills">Beceriler</Label>
              <Input
                id="skills"
                value={skills}
                onChange={(e) => { setSkills(e.target.value); setSaveState("idle"); }}
                placeholder="React, TypeScript, Next.js, Node.js"
              />
              <p className="text-xs text-muted-foreground">Virgülle ayır.</p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {profileError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={saveProfile}
                disabled={saveState === "saving"}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saveState === "saving" ? "Kaydediliyor…" : "Kaydet"}
              </Button>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Kaydedildi
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Uyarlama sekmesi ── */}
      {activeTab === "uyarlama" && (
        <div className="space-y-4">
          {!profileSaved && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Uyarlamak için önce profilini kaydet.
            </div>
          )}
          {adaptError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {adaptError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {PLATFORM_IDS.map((id) => (
              <Card key={id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{PLATFORMS[id].label}</CardTitle>
                    <Button
                      size="sm"
                      variant={results[id] ? "outline" : "default"}
                      onClick={() => adapt(id)}
                      disabled={adapting === id || !profileSaved}
                      className="gap-1.5 h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      {adapting === id ? "Uyarlanıyor…" : results[id] ? "Yenile" : "Uyarla"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results[id] ? (
                    <div className="space-y-2.5">
                      <p className="text-sm font-medium leading-snug">{results[id]!.headline}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {results[id]!.body}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {PLATFORMS[id].label} için optimize metin burada görünecek.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Portfolyo sekmesi ── */}
      {activeTab === "portfolyo" && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Portfolyo Sitesi</CardTitle>
              <CardDescription>
                Profilinden herkese açık bir sayfa oluştur ve paylaş.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!profileSaved && !portfolio?.content && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Portfolyo oluşturmak için önce profilini kaydet.
                </div>
              )}

              <Button
                onClick={generatePortfolio}
                disabled={generating || (!profileSaved && !portfolio?.content)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Üretiliyor…" : portfolio?.content ? "Yeniden Üret" : "Portfolyo Üret"}
              </Button>

              {portfolioError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {portfolioError}
                </div>
              )}

              {portfolio?.content && (
                <div className="space-y-5 border-t pt-5">
                  {/* Preview */}
                  <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                    <p className="font-semibold text-sm">{portfolio.content.headline}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {portfolio.content.bio}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {portfolio.content.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                          {s}
                        </span>
                      ))}
                      {portfolio.content.skills.length > 6 && (
                        <span className="text-xs text-muted-foreground">
                          +{portfolio.content.skills.length - 6} daha
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="portfolio-slug">Sayfa adresi</Label>
                      <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                        <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-input select-none py-2">/p/</span>
                        <input
                          id="portfolio-slug"
                          value={portfolioSlug}
                          onChange={(e) => setPortfolioSlug(e.target.value.toLowerCase())}
                          placeholder="kullanici-adi"
                          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Küçük harf, rakam, tire. Min 3 karakter.</p>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 cursor-pointer pb-2">
                        <div
                          onClick={() => setPortfolioPublished((v) => !v)}
                          className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${portfolioPublished ? "bg-primary" : "bg-muted-foreground/30"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${portfolioPublished ? "translate-x-4" : ""}`} />
                        </div>
                        <span className="text-sm font-medium">Herkese açık</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={savePortfolioSettings} disabled={savingPortfolio} variant="outline" className="gap-2">
                      <Save className="h-4 w-4" />
                      {savingPortfolio ? "Kaydediliyor…" : "Ayarları Kaydet"}
                    </Button>
                    {portfolio.published && (
                      <a
                        href={`/p/${portfolio.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        Sayfayı görüntüle <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── İlanlar sekmesi ── */}
      {activeTab === "ilanlar" && (
        <div className="space-y-4">
          {/* Add form toggle */}
          {!addFormOpen ? (
            <Button
              variant="outline"
              onClick={() => setAddFormOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              İlan Ekle
            </Button>
          ) : (
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Yeni İlan</CardTitle>
                  <button
                    onClick={() => { setAddFormOpen(false); setAddError(""); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-title">İlan başlığı *</Label>
                  <Input
                    id="add-title"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="ör. Senior React Developer"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="add-company">Şirket</Label>
                    <Input id="add-company" value={addCompany} onChange={(e) => setAddCompany(e.target.value)} placeholder="ör. Acme Corp" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="add-platform">Platform</Label>
                    <Input id="add-platform" value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)} placeholder="ör. LinkedIn" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-description">İlan metni *</Label>
                  <Textarea
                    id="add-description"
                    rows={5}
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="İlanın tam metnini yapıştır…"
                    className="resize-none"
                  />
                </div>
                {addError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {addError}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={addJob}
                    disabled={adding || !addTitle.trim() || !addDescription.trim()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {adding ? "Ekleniyor…" : "Ekle"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setAddFormOpen(false); setAddError(""); }}>
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {jobError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {jobError}
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Henüz ilan yok</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                &quot;İlan Ekle&quot; ile başla; profilinle eşleştir.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id} className="shadow-sm">
                  <CardContent className="pt-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug truncate">{job.title}</p>
                        {(job.company || job.platform) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[job.company, job.platform].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {job.match_score !== null && (
                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${scoreColor(job.match_score)}`}>
                          {job.match_score}<span className="font-normal text-[10px]">/100</span>
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_CLASSES[job.status]}`}
                      >
                        {JOB_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => matchJob(job.id)}
                        disabled={matchingId === job.id || !initialProfile}
                        title={!initialProfile ? "Önce profil doldur" : undefined}
                        className="gap-1.5 h-7 text-xs"
                      >
                        <Target className="h-3 w-3" />
                        {matchingId === job.id ? "Analiz ediliyor…" : "Eşleştir"}
                      </Button>

                      <button
                        onClick={() => deleteJob(job.id)}
                        disabled={deletingId === job.id}
                        className="ml-auto text-muted-foreground/50 hover:text-destructive transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Match result */}
                    {job.match_result && (
                      <div className="rounded-xl bg-muted/50 border p-3.5 space-y-3 text-sm">
                        <p className="text-muted-foreground leading-relaxed">{job.match_result.summary}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {job.match_result.strengths.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Güçlü
                              </p>
                              <ul className="space-y-1">
                                {job.match_result.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">· {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.match_result.gaps.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Eksik
                              </p>
                              <ul className="space-y-1">
                                {job.match_result.gaps.map((g, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">· {g}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ── Analitik sekmesi ── */}
      {activeTab === "analitik" && (
        <div className="space-y-4">
          {/* Özet kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground font-medium">Toplam Harcama</p>
                <p className="text-2xl font-extrabold tabular-nums mt-1">{formatUsd(initialAnalytics.totalUsd)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{initialAnalytics.totalCount} işlem</p>
              </CardContent>
            </Card>
            {Object.entries(initialAnalytics.byKind).map(([kind, { count, costUsd }]) => (
              <Card key={kind} className="shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground font-medium">{KIND_LABELS[kind] ?? kind}</p>
                  <p className="text-2xl font-extrabold tabular-nums mt-1">{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatUsd(costUsd)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Günlük harcama grafiği (CSS bar chart) */}
          {initialAnalytics.dailySeries.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Son 30 Gün — Günlük Harcama</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const max = Math.max(...initialAnalytics.dailySeries.map((d) => d.costUsd), 0.000001);
                  return (
                    <div className="flex items-end gap-1 h-28">
                      {initialAnalytics.dailySeries.map(({ date, costUsd }) => (
                        <div
                          key={date}
                          className="group relative flex-1 min-w-0"
                          title={`${date}: ${formatUsd(costUsd)}`}
                        >
                          <div
                            className="w-full rounded-sm bg-primary/60 hover:bg-primary transition-colors"
                            style={{ height: `${Math.max((costUsd / max) * 100, 4)}%` }}
                          />
                          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-foreground text-background rounded px-1 py-0.5 whitespace-nowrap z-10">
                            {formatUsd(costUsd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{initialAnalytics.dailySeries[0]?.date?.slice(5)}</span>
                  <span>{initialAnalytics.dailySeries.at(-1)?.date?.slice(5)}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Henüz kullanım yok</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Uyarlama, portfolyo veya eşleştirme yaptıkça burada görünür.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
