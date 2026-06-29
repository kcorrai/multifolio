"use client";

import { useState } from "react";
import {
  User, Layers, Globe, Briefcase, Save, Sparkles, Target,
  Trash2, Plus, X, ExternalLink, CheckCircle2, AlertCircle, BarChart3,
  Copy, Check, TrendingUp, Zap, Wallet, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import { PlatformLogo } from "@/components/platform-logo";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import { JOB_STATUSES, type JobStatus, type JobMatchResult } from "@/lib/validation/schemas/job";

/* ── Types ──────────────────────────────────────────────────────────── */

interface InitialProfile { headline: string; summary: string; skills: string[] }
interface InitialPortfolio { slug: string; published: boolean; content: PortfolioContent | null }
interface AdaptOutput { headline: string; body: string }
interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
}
interface AnalyticsData {
  totalUsd: number; totalCount: number;
  byKind: Record<string, { count: number; costUsd: number }>;
  dailySeries: { date: string; costUsd: number }[];
}
type Tab = "profil" | "uyarlama" | "portfolyo" | "ilanlar" | "analitik";

/* ── Constants ──────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Kaydedildi", applied: "Başvuruldu", interview: "Görüşme",
  offer: "Teklif", rejected: "Reddedildi",
};

const STATUS_CLASSES: Record<JobStatus, string> = {
  saved:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  applied:   "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  interview: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  offer:     "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  rejected:  "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

const STATUS_DOT: Record<JobStatus, string> = {
  saved: "bg-slate-400", applied: "bg-blue-500", interview: "bg-amber-500",
  offer: "bg-green-500", rejected: "bg-red-500",
};

const PLATFORM_STYLES: Record<PlatformId, { accent: string; icon: string; badge: string }> = {
  linkedin: { accent: "border-t-4 border-t-blue-500",   icon: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",   badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  upwork:   { accent: "border-t-4 border-t-green-500",  icon: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400", badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  fiverr:   { accent: "border-t-4 border-t-emerald-500",icon: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  bionluk:  { accent: "border-t-4 border-t-violet-500", icon: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400", badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  armut:    { accent: "border-t-4 border-t-orange-500", icon: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

const KIND_LABELS: Record<string, string> = {
  adaptation: "Platform Uyarlama",
  portfolio_generation: "Portfolyo Üretimi",
  job_match: "İlan Eşleştirme",
};

const KIND_ICONS: Record<string, React.ElementType> = {
  adaptation: Layers,
  portfolio_generation: Globe,
  job_match: Target,
};

function scoreColor(n: number) {
  if (n >= 70) return "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800";
  if (n >= 40) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800";
  return "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900";
}

function scoreBarColor(n: number) {
  if (n >= 70) return "bg-green-500";
  if (n >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function formatUsd(n: number) {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Kopyala"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */

export function ProfileStudio({
  initialProfile, initialSpendUsd, initialPortfolio, initialJobs, initialAnalytics, initialCredits,
}: {
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
  initialPortfolio: InitialPortfolio | null;
  initialJobs: JobRow[];
  initialAnalytics: AnalyticsData;
  initialCredits: number;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialProfile !== null ? "saved" : "idle",
  );
  const [profileError, setProfileError] = useState("");
  const [spend, setSpend] = useState(initialSpendUsd);
  const [credits] = useState(initialCredits);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [results, setResults] = useState<Partial<Record<PlatformId, AdaptOutput>>>({});
  const [adapting, setAdapting] = useState<PlatformId | null>(null);
  const [adaptError, setAdaptError] = useState("");
  const [portfolio, setPortfolio] = useState<InitialPortfolio | null>(initialPortfolio);
  const [portfolioSlug, setPortfolioSlug] = useState(initialPortfolio?.slug ?? "");
  const [portfolioPublished, setPortfolioPublished] = useState(initialPortfolio?.published ?? false);
  const [generating, setGenerating] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
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
    setSaveState("saving"); setProfileError("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, summary, skills: skills.split(",").map((s) => s.trim()).filter(Boolean) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSaveState("error"); setProfileError(body?.error?.message ?? "Profil kaydedilemedi.");
      return;
    }
    setSaveState("saved");
  }

  async function adapt(platform: PlatformId) {
    setAdapting(platform); setAdaptError("");
    const res = await fetch("/api/adapt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setAdaptError(body?.error?.message ?? "Uyarlama başarısız."); setAdapting(null); return; }
    setResults((prev) => ({ ...prev, [platform]: body.output }));
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setAdapting(null);
  }

  async function generatePortfolio() {
    setGenerating(true); setPortfolioError("");
    const res = await fetch("/api/portfolio/generate", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setPortfolioError(body?.error?.message ?? "Portfolyo üretilemedi."); setGenerating(false); return; }
    const p = body.portfolio;
    setPortfolio({ slug: p.slug, published: p.published, content: p.content });
    setPortfolioSlug(p.slug);
    setPortfolioPublished(p.published);
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setGenerating(false);
  }

  async function savePortfolioSettings() {
    setSavingPortfolio(true); setPortfolioError("");
    const res = await fetch("/api/portfolio", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: portfolioSlug, published: portfolioPublished }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setPortfolioError(body?.error?.message ?? "Ayarlar kaydedilemedi."); setSavingPortfolio(false); return; }
    setPortfolio((prev) => prev ? { ...prev, slug: body.portfolio.slug, published: body.portfolio.published } : null);
    setSavingPortfolio(false);
  }

  async function addJob() {
    setAdding(true); setAddError("");
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: addTitle, company: addCompany || undefined, platform: addPlatform || undefined, description: addDescription }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setAddError(body?.error?.message ?? "İlan eklenemedi."); setAdding(false); return; }
    setJobs((prev) => [body.job as JobRow, ...prev]);
    setAddTitle(""); setAddCompany(""); setAddPlatform(""); setAddDescription("");
    setAddFormOpen(false); setAdding(false);
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    setJobError("");
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setJobError(body?.error?.message ?? "Durum güncellenemedi."); return; }
    setJobs((prev) => prev.map((j) => (j.id === id ? (body.job as JobRow) : j)));
  }

  async function matchJob(id: string) {
    setMatchingId(id); setJobError("");
    const res = await fetch(`/api/jobs/${id}/match`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setJobError(body?.error?.message ?? "Eşleştirme başarısız."); setMatchingId(null); return; }
    setJobs((prev) => prev.map((j) => (j.id === id ? (body.job as JobRow) : j)));
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setMatchingId(null);
  }

  async function deleteJob(id: string) {
    setDeletingId(id); setJobError("");
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setJobError(body?.error?.message ?? "İlan silinemedi."); setDeletingId(null); return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id)); setDeletingId(null);
  }

  const profileSaved = saveState === "saved";
  const readyPlatforms = PLATFORM_IDS.filter((id) => results[id]).length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "profil",    label: "Profil",           icon: User },
    { id: "uyarlama",  label: "Platform Uyarlama", icon: Layers },
    { id: "portfolyo", label: "Portfolyo",         icon: Globe },
    { id: "ilanlar",   label: "İlanlar",           icon: Briefcase, badge: jobs.length || undefined },
    { id: "analitik",  label: "Analitik",          icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil Stüdyosu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Profilini yönet, platformlara uyarla ve ilanları takip et.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">AI harcama</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{formatUsd(spend)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Wallet className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Kredi</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{credits}</span>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button
              onClick={() => { setShowComingSoon(true); setTimeout(() => setShowComingSoon(false), 3000); }}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              Satın Al
            </button>
          </div>
        </div>
      </div>

      {/* ── Coming soon toast ── */}
      {showComingSoon && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-violet-200 bg-white dark:bg-slate-900 dark:border-violet-800/60 px-4 py-3 shadow-lg shadow-violet-500/10">
          <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
            <Wallet className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ödeme sistemi yakında!</p>
            <p className="text-xs text-muted-foreground">Stripe entegrasyonu hazırlanıyor.</p>
          </div>
        </div>
      )}

      {/* ── Quick stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${profileSaved ? "border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/30" : "border-border bg-card"}`}>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${profileSaved ? "bg-green-100 dark:bg-green-900/50" : "bg-muted"}`}>
            <User className={`h-4 w-4 ${profileSaved ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Profil</p>
            <p className={`text-sm font-semibold truncate ${profileSaved ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
              {profileSaved ? "Kaydedildi" : "Taslak"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Platform</p>
            <p className="text-sm font-semibold">{readyPlatforms}<span className="text-muted-foreground font-normal">/{PLATFORM_IDS.length} hazır</span></p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">İlanlar</p>
            <p className="text-sm font-semibold">{jobs.length}<span className="text-muted-foreground font-normal"> takip</span></p>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-card shadow-sm text-foreground"
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
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Form */}
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Çekirdek Profil</CardTitle>
              <CardDescription>Bu bilgiler tüm platformlara ve portfolyona temel oluşturur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="headline">Başlık</Label>
                <Input id="headline" value={headline}
                  onChange={(e) => { setHeadline(e.target.value); setSaveState("idle"); }}
                  placeholder="ör. Senior Frontend Developer · React & TypeScript" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="summary">Özet</Label>
                <Textarea id="summary" rows={5} value={summary}
                  onChange={(e) => { setSummary(e.target.value); setSaveState("idle"); }}
                  placeholder="Deneyimini, uzmanlığını ve öne çıkan sonuçları kısaca anlat."
                  className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="skills">Beceriler</Label>
                <Input id="skills" value={skills}
                  onChange={(e) => { setSkills(e.target.value); setSaveState("idle"); }}
                  placeholder="React, TypeScript, Next.js, Node.js" />
                <p className="text-xs text-muted-foreground">Virgülle ayır.</p>
              </div>

              {profileError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{profileError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button onClick={saveProfile} disabled={saveState === "saving"} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saveState === "saving" ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> Kaydedildi
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live preview card */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-primary/50" />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Önizleme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {headline ? (
                  <p className="font-bold text-foreground leading-snug">{headline}</p>
                ) : (
                  <div className="h-5 rounded-md bg-muted animate-pulse" />
                )}
                {summary ? (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{summary}</p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-muted animate-pulse" />
                    <div className="h-3 rounded bg-muted animate-pulse w-4/5" />
                    <div className="h-3 rounded bg-muted animate-pulse w-3/5" />
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills ? (
                    skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">{s}</span>
                    ))
                  ) : (
                    ["•••", "••••", "•••••"].map((s, i) => (
                      <span key={i} className="rounded-full bg-muted px-3 py-0.5 text-[11px] text-transparent animate-pulse">{s}</span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tamamlanma</p>
                <div className="space-y-2">
                  {[
                    { label: "Başlık", done: headline.trim().length > 0 },
                    { label: "Özet", done: summary.trim().length > 0 },
                    { label: "Beceriler", done: skills.trim().length > 0 },
                    { label: "Kaydedildi", done: profileSaved },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-500" : "bg-muted"}`}>
                        {done && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Uyarlama sekmesi ── */}
      {activeTab === "uyarlama" && (
        <div className="space-y-4">
          {!profileSaved && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />Uyarlamak için önce profilini kaydet.
            </div>
          )}
          {adaptError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{adaptError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PLATFORM_IDS.map((id) => {
              const style = PLATFORM_STYLES[id];
              const result = results[id];
              return (
                <Card key={id} className={`shadow-sm overflow-hidden ${style.accent}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.icon}`}>
                          <PlatformLogo platform={id} size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{PLATFORMS[id].label}</p>
                          {result && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>✓ Hazır</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant={result ? "outline" : "default"}
                        onClick={() => adapt(id)} disabled={adapting === id || !profileSaved}
                        className="gap-1.5 h-7 text-xs shrink-0">
                        <Sparkles className="h-3 w-3" />
                        {adapting === id ? "Uyarlanıyor…" : result ? "Yenile" : "Uyarla"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result ? (
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug">{result.headline}</p>
                          <CopyButton text={`${result.headline}\n\n${result.body}`} />
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                          {result.body}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted/50 border border-dashed p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                          {PLATFORMS[id].label} için optimize metin burada görünecek.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Portfolyo sekmesi ── */}
      {activeTab === "portfolyo" && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Portfolyo Sitesi</CardTitle>
              <CardDescription>Profilinden herkese açık bir sayfa oluştur ve paylaş.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!profileSaved && !portfolio?.content && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />Portfolyo oluşturmak için önce profilini kaydet.
                </div>
              )}

              <Button onClick={generatePortfolio} disabled={generating || (!profileSaved && !portfolio?.content)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {generating ? "Üretiliyor…" : portfolio?.content ? "Yeniden Üret" : "Portfolyo Üret"}
              </Button>

              {portfolioError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{portfolioError}
                </div>
              )}

              {portfolio?.content && (
                <div className="space-y-5 border-t pt-5">
                  {/* Preview card */}
                  <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-violet-500/5 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-primary/40" />
                    <div className="p-5 space-y-3">
                      <p className="font-bold text-lg text-foreground">{portfolio.content.headline}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{portfolio.content.bio}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {portfolio.content.skills.slice(0, 8).map((s) => (
                          <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{s}</span>
                        ))}
                        {portfolio.content.skills.length > 8 && (
                          <span className="text-xs text-muted-foreground self-center">+{portfolio.content.skills.length - 8} daha</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="portfolio-slug">Sayfa adresi</Label>
                      <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                        <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-input select-none py-2">/p/</span>
                        <input id="portfolio-slug" value={portfolioSlug}
                          onChange={(e) => setPortfolioSlug(e.target.value.toLowerCase())}
                          placeholder="kullanici-adi"
                          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Küçük harf, rakam, tire. Min 3 karakter.</p>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 cursor-pointer pb-2">
                        <div onClick={() => setPortfolioPublished((v) => !v)}
                          className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${portfolioPublished ? "bg-primary" : "bg-muted-foreground/30"}`}>
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
                      <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline">
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
          {!addFormOpen ? (
            <Button variant="outline" onClick={() => setAddFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />İlan Ekle
            </Button>
          ) : (
            <Card className="shadow-sm border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Yeni İlan</CardTitle>
                  <button onClick={() => { setAddFormOpen(false); setAddError(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-title">İlan başlığı *</Label>
                  <Input id="add-title" value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="ör. Senior React Developer" autoFocus />
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
                  <Textarea id="add-description" rows={5} value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="İlanın tam metnini yapıştır…" className="resize-none" />
                </div>
                {addError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />{addError}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button onClick={addJob} disabled={adding || !addTitle.trim() || !addDescription.trim()} className="gap-2">
                    <Plus className="h-4 w-4" />{adding ? "Ekleniyor…" : "Ekle"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setAddFormOpen(false); setAddError(""); }}>İptal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {jobError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{jobError}
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Henüz ilan yok</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                &quot;İlan Ekle&quot; ile başla; profilinle eşleştir ve başvurularını takip et.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pipeline özet */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {JOB_STATUSES.map((s) => {
                  const count = jobs.filter((j) => j.status === s).length;
                  return count > 0 ? (
                    <div key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${STATUS_CLASSES[s]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                      {STATUS_LABELS[s]} · {count}
                    </div>
                  ) : null;
                })}
              </div>

              {jobs.map((job) => (
                <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-snug truncate">{job.title}</p>
                        {(job.company || job.platform) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[job.company, job.platform].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.match_score !== null && (
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${scoreColor(job.match_score)}`}>
                            {job.match_score}<span className="font-normal text-[10px]">/100</span>
                          </span>
                        )}
                        <button onClick={() => deleteJob(job.id)} disabled={deletingId === job.id}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors" title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Score bar */}
                    {job.match_score !== null && (
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${scoreBarColor(job.match_score)}`}
                            style={{ width: `${job.match_score}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <select value={job.status} onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_CLASSES[job.status]}`}>
                        {JOB_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => matchJob(job.id)}
                        disabled={matchingId === job.id || !initialProfile}
                        title={!initialProfile ? "Önce profil doldur" : undefined}
                        className="gap-1.5 h-7 text-xs">
                        <Target className="h-3 w-3" />
                        {matchingId === job.id ? "Analiz ediliyor…" : "Eşleştir"}
                      </Button>
                    </div>

                    {job.match_result && (
                      <div className="rounded-xl bg-muted/40 border p-3.5 space-y-3 text-sm">
                        <p className="text-muted-foreground leading-relaxed text-xs">{job.match_result.summary}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {job.match_result.strengths.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Güçlü
                              </p>
                              <ul className="space-y-0.5">
                                {job.match_result.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">· {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.match_result.gaps.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Eksik
                              </p>
                              <ul className="space-y-0.5">
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
          {/* Kredi durumu kartı */}
          <Card className="shadow-sm overflow-hidden border-violet-200 dark:border-violet-800/40">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Kredi Bakiyesi</p>
                    <p className="text-3xl font-extrabold tabular-nums">{credits}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">kredi kaldı</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowComingSoon(true); setTimeout(() => setShowComingSoon(false), 3000); }}
                  className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Kredi Satın Al
                  <span className="rounded-full bg-violet-200 dark:bg-violet-800 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">Yakında</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">Toplam Harcama</p>
                </div>
                <p className="text-2xl font-extrabold tabular-nums">{formatUsd(initialAnalytics.totalUsd)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{initialAnalytics.totalCount} işlem</p>
              </CardContent>
            </Card>
            {Object.entries(initialAnalytics.byKind).map(([kind, { count, costUsd }]) => {
              const KindIcon = KIND_ICONS[kind] ?? Zap;
              return (
                <Card key={kind} className="shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <KindIcon className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">{KIND_LABELS[kind] ?? kind}</p>
                    </div>
                    <p className="text-2xl font-extrabold tabular-nums">{count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatUsd(costUsd)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {initialAnalytics.dailySeries.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Son 30 Gün — Günlük AI Harcaması</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const max = Math.max(...initialAnalytics.dailySeries.map((d) => d.costUsd), 0.000001);
                  return (
                    <div className="flex items-end gap-1 h-32">
                      {initialAnalytics.dailySeries.map(({ date, costUsd }) => (
                        <div key={date} className="group relative flex-1 min-w-0" title={`${date}: ${formatUsd(costUsd)}`}>
                          <div className="w-full rounded-t-sm bg-primary/40 hover:bg-primary transition-colors"
                            style={{ height: `${Math.max((costUsd / max) * 100, 4)}%` }} />
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-foreground text-background rounded px-1.5 py-0.5 whitespace-nowrap z-10">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Henüz kullanım yok</p>
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
