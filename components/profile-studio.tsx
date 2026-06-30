"use client";

import { useState } from "react";
import {
  User, Layers, Globe, Briefcase, Save, Sparkles, Target,
  Trash2, Plus, X, ExternalLink, CheckCircle2, AlertCircle, BarChart3,
  Copy, Check, TrendingUp, Zap, Wallet, ShoppingCart, Link2, LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
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
type Tab = "genel" | "profil" | "uyarlama" | "portfolyo" | "ilanlar" | "analitik" | "hesaplar";

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
  linkedin: { accent: "border-t-4 border-t-blue-500",    icon: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",       badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"     },
  upwork:   { accent: "border-t-4 border-t-green-500",   icon: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400",    badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"  },
  fiverr:   { accent: "border-t-4 border-t-emerald-500", icon: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  bionluk:  { accent: "border-t-4 border-t-violet-500",  icon: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400", badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  armut:    { accent: "border-t-4 border-t-orange-500",  icon: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

const PLATFORM_URL_PLACEHOLDERS: Record<PlatformId, string> = {
  linkedin: "https://www.linkedin.com/in/kullanici-adi",
  upwork:   "https://www.upwork.com/freelancers/~profil-id",
  fiverr:   "https://www.fiverr.com/kullanici-adi",
  bionluk:  "https://www.bionluk.com/kullanici-adi",
  armut:    "https://armut.com/kullanici/kullanici-adi",
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
  userEmail,
  initialProfile, initialSpendUsd, initialPortfolio, initialJobs, initialAnalytics, initialCredits, initialConnections,
}: {
  userEmail: string;
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
  initialPortfolio: InitialPortfolio | null;
  initialJobs: JobRow[];
  initialAnalytics: AnalyticsData;
  initialCredits: number;
  initialConnections: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("genel");
  const [onboardingDismissed, setOnboardingDismissed] = useState(initialProfile !== null);

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

  const [connections, setConnections] = useState<Record<string, string>>(initialConnections);
  const [connectionDraft, setConnectionDraft] = useState<Record<string, string>>(initialConnections);
  const [savingConnection, setSavingConnection] = useState<PlatformId | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<PlatformId | null>(null);
  const [connectionError, setConnectionError] = useState<Record<string, string>>({});

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

  async function saveConnection(platform: PlatformId) {
    const url = (connectionDraft[platform] ?? "").trim();
    setSavingConnection(platform);
    setConnectionError((prev) => ({ ...prev, [platform]: "" }));
    const res = await fetch("/api/platform-connections", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, profile_url: url }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setConnectionError((prev) => ({ ...prev, [platform]: body?.error?.message ?? "Kaydedilemedi." }));
      setSavingConnection(null); return;
    }
    setConnections((prev) => ({ ...prev, [platform]: url }));
    setSavingConnection(null);
  }

  async function removeConnection(platform: PlatformId) {
    setDeletingConnection(platform);
    const res = await fetch("/api/platform-connections", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setConnectionError((prev) => ({ ...prev, [platform]: body?.error?.message ?? "Silinemedi." }));
      setDeletingConnection(null); return;
    }
    setConnections((prev) => { const n = { ...prev }; delete n[platform]; return n; });
    setConnectionDraft((prev) => { const n = { ...prev }; delete n[platform]; return n; });
    setDeletingConnection(null);
  }

  /* — Computed — */

  const profileSaved = saveState === "saved";
  const readyPlatforms = PLATFORM_IDS.filter((id) => results[id]).length;
  const connectedCount = Object.keys(connections).length;
  const onboardingStep = !profileSaved ? 1 : readyPlatforms === 0 ? 2 : !portfolio?.published ? 3 : 4;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "genel",    label: "Genel Bakış",      icon: LayoutDashboard },
    { id: "profil",   label: "Profil",            icon: User },
    { id: "uyarlama", label: "Platform Uyarlama", icon: Layers },
    { id: "portfolyo",label: "Portfolyo",          icon: Globe },
    { id: "ilanlar",  label: "İlanlar",            icon: Briefcase, badge: jobs.length || undefined },
    { id: "analitik", label: "Analitik",           icon: BarChart3 },
    { id: "hesaplar", label: "Hesaplar",           icon: Link2, badge: connectedCount || undefined },
  ];

  const userInitial = userEmail?.[0]?.toUpperCase() ?? "?";

  function triggerComingSoon() {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  }

  /* ─────────────────────────────── RENDER ────────────────────────────── */

  return (
    <div className="flex h-dvh overflow-hidden bg-background">

      {/* ── SIDEBAR (desktop) ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col shrink-0 border-r border-border bg-background">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
          <div className="h-7 w-7 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
            <span className="text-[#00F0FF] text-sm font-extrabold">M</span>
          </div>
          <span className="font-bold tracking-tight text-sm">Multifolio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                activeTab === id
                  ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  activeTab === id ? "bg-[#00F0FF]/20 text-[#00F0FF]" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: credits + user */}
        <div className="shrink-0 px-3 pb-4 pt-3 border-t border-border space-y-3">
          <div className="rounded-xl bg-violet-500/8 dark:bg-violet-500/10 border border-violet-500/15 dark:border-violet-500/20 px-3 py-2.5 flex items-center gap-2.5">
            <Wallet className="h-4 w-4 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">Kredi</p>
              <p className="text-sm font-bold tabular-nums leading-none">{credits}</p>
            </div>
            <button
              onClick={triggerComingSoon}
              className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
            >
              Satın Al
            </button>
          </div>
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-7 w-7 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#00F0FF]">{userInitial}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">{userEmail}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" title="Çıkış Yap" className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
          {/* Mobile: logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-6 w-6 rounded-md bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
              <span className="text-[#00F0FF] text-xs font-extrabold">M</span>
            </div>
            <span className="font-bold text-sm tracking-tight">Multifolio</span>
          </div>
          {/* Desktop: page title */}
          <h1 className="hidden lg:block text-base font-semibold text-foreground">
            {TABS.find((t) => t.id === activeTab)?.label ?? "Dashboard"}
          </h1>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <Zap className="h-3 w-3 text-[#00F0FF] shrink-0" />
              <span className="text-[11px] text-muted-foreground font-medium">AI</span>
              <span className="text-xs font-bold tabular-nums">{formatUsd(spend)}</span>
            </div>
            <ThemeToggle />
            <form action="/auth/signout" method="post" className="lg:hidden">
              <Button type="submit" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </header>

        {/* Mobile tab scroll */}
        <div className="lg:hidden flex overflow-x-auto border-b border-border px-3 py-2 gap-1 shrink-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                activeTab === id
                  ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
              {badge !== undefined && (
                <span className={`rounded-full px-1 text-[9px] font-bold py-0.5 ${
                  activeTab === id ? "bg-[#00F0FF]/20 text-[#00F0FF]" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">

            {/* ══════════════════════════════════════════════════════════
                GENEL BAKIŞ
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "genel" && (
              <div className="space-y-6">

                {/* Onboarding banner */}
                {!onboardingDismissed && onboardingStep < 4 && (
                  <div className="relative rounded-2xl border border-[#00F0FF]/20 dark:border-[#00F0FF]/15 bg-[#00F0FF]/5 overflow-hidden">
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00F0FF] to-violet-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm font-bold text-[#00F0FF] flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" />
                            Multifolio&apos;ya hoş geldin!
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">3 adımda freelancer profilini kuralım.</p>
                        </div>
                        <button
                          onClick={() => setOnboardingDismissed(true)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                          title="Kapat"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { step: 1, label: "Profil doldur",    desc: "Başlık, özet ve becerileri gir.",      tab: "profil"   as Tab },
                          { step: 2, label: "Platform uyarla",  desc: "AI ile 5 platform için optimize et.",  tab: "uyarlama" as Tab },
                          { step: 3, label: "Portfolyo yayınla",desc: "Herkese açık sayfanı hazırla.",        tab: "portfolyo" as Tab },
                        ].map(({ step, label, desc, tab }) => {
                          const done = onboardingStep > step;
                          const active = onboardingStep === step;
                          return (
                            <button
                              key={step}
                              onClick={() => setActiveTab(tab)}
                              className={`text-left rounded-xl p-3 border transition-all cursor-pointer ${
                                done
                                  ? "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/20"
                                  : active
                                  ? "border-[#00F0FF]/30 bg-white dark:border-[#00F0FF]/20 dark:bg-[#00F0FF]/5 shadow-sm"
                                  : "border-border opacity-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-extrabold ${
                                  done ? "bg-green-500 text-white" : active ? "bg-[#00F0FF] text-[#090A0F]" : "bg-muted text-muted-foreground"
                                }`}>
                                  {done ? <Check className="h-3 w-3" /> : step}
                                </div>
                                <span className={`text-xs font-semibold ${done ? "text-green-700 dark:text-green-400" : active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground/70 leading-snug pl-7">{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section title */}
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Genel Bakış</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Credits */}
                  <div className="rounded-2xl border border-violet-500/15 dark:border-violet-500/20 bg-card p-5 space-y-4">
                    <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Kredi</p>
                      <p className="text-2xl font-extrabold tabular-nums mt-0.5">{credits}</p>
                    </div>
                    <button onClick={triggerComingSoon} className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer">
                      <ShoppingCart className="h-3 w-3" />Satın Al
                    </button>
                  </div>

                  {/* AI Spend */}
                  <div className="rounded-2xl border border-[#00F0FF]/15 bg-card p-5 space-y-4">
                    <div className="h-9 w-9 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-[#00F0FF]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">AI Harcama</p>
                      <p className="text-2xl font-extrabold tabular-nums mt-0.5">{formatUsd(spend)}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{initialAnalytics.totalCount} işlem</p>
                  </div>

                  {/* Platforms */}
                  <div className="rounded-2xl border border-[#00F0FF]/15 bg-card p-5 space-y-4">
                    <div className="h-9 w-9 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-[#00F0FF]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Platform</p>
                      <p className="text-2xl font-extrabold tabular-nums mt-0.5">
                        {readyPlatforms}<span className="text-base font-normal text-muted-foreground">/{PLATFORM_IDS.length}</span>
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">platform uyarlandı</p>
                  </div>

                  {/* Jobs */}
                  <div className="rounded-2xl border border-violet-500/15 dark:border-violet-500/20 bg-card p-5 space-y-4">
                    <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">İlanlar</p>
                      <p className="text-2xl font-extrabold tabular-nums mt-0.5">{jobs.length}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">ilan takip ediliyor</p>
                  </div>
                </div>

                {/* Platform status + Recent jobs */}
                <div className="grid lg:grid-cols-2 gap-5">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Platform Uyarlama</CardTitle>
                        <button onClick={() => setActiveTab("uyarlama")} className="text-xs text-[#00F0FF] hover:underline transition-colors cursor-pointer">
                          Tümünü Gör
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {PLATFORM_IDS.map((id) => {
                        const adapted = !!results[id];
                        const pStyle = PLATFORM_STYLES[id];
                        return (
                          <div key={id} className="flex items-center gap-3">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${pStyle.icon}`}>
                              <PlatformLogo platform={id} size={14} />
                            </div>
                            <span className="text-sm font-medium flex-1">{PLATFORMS[id].label}</span>
                            {adapted ? (
                              <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />Hazır
                              </span>
                            ) : (
                              <Button size="sm" onClick={() => adapt(id)} disabled={adapting === id || !profileSaved} className="h-6 text-[11px] gap-1 px-2.5">
                                <Sparkles className="h-3 w-3" />
                                {adapting === id ? "..." : "Uyarla"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Son İlanlar</CardTitle>
                        <button onClick={() => setActiveTab("ilanlar")} className="text-xs text-[#00F0FF] hover:underline transition-colors cursor-pointer">
                          {jobs.length > 0 ? "Tümünü Gör" : "İlan Ekle"}
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {jobs.length === 0 ? (
                        <div className="flex flex-col items-center py-8 gap-2 text-center">
                          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-xs text-muted-foreground">Henüz ilan yok</p>
                          <p className="text-[11px] text-muted-foreground/60 max-w-[180px]">İlan Ekle ile başlayabilirsin.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {jobs.slice(0, 4).map((job) => (
                            <div key={job.id} className="flex items-start gap-2.5">
                              <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{job.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {[job.company, STATUS_LABELS[job.status]].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                              {job.match_score !== null && (
                                <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums shrink-0 ${scoreColor(job.match_score)}`}>
                                  {job.match_score}
                                </span>
                              )}
                            </div>
                          ))}
                          {jobs.length > 4 && (
                            <button onClick={() => setActiveTab("ilanlar")} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                              +{jobs.length - 4} ilan daha
                            </button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Profile incomplete alert */}
                {!profileSaved && (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-4">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Profil tamamlanmadı</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                        Başlık, özet ve becerilerini ekleyerek platformlara uyarlamaya başla.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setActiveTab("profil")} variant="outline" className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                      Profili Düzenle
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                PROFİL
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "profil" && (
              <div className="grid gap-5 lg:grid-cols-5">
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
                          { label: "Başlık",     done: headline.trim().length > 0 },
                          { label: "Özet",       done: summary.trim().length > 0 },
                          { label: "Beceriler",  done: skills.trim().length > 0 },
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

            {/* ══════════════════════════════════════════════════════════
                PLATFORM UYARLAMA
            ══════════════════════════════════════════════════════════ */}
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

            {/* ══════════════════════════════════════════════════════════
                PORTFOLYO
            ══════════════════════════════════════════════════════════ */}
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

            {/* ══════════════════════════════════════════════════════════
                İLANLAR
            ══════════════════════════════════════════════════════════ */}
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
                        <button onClick={() => { setAddFormOpen(false); setAddError(""); }} className="text-muted-foreground hover:text-foreground cursor-pointer">
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
                                className="text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer" title="Sil">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {job.match_score !== null && (
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${scoreBarColor(job.match_score)}`}
                                style={{ width: `${job.match_score}%` }} />
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

            {/* ══════════════════════════════════════════════════════════
                ANALİTİK
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "analitik" && (
              <div className="space-y-4">
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
                        onClick={triggerComingSoon}
                        className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors cursor-pointer"
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

            {/* ══════════════════════════════════════════════════════════
                HESAPLAR
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "hesaplar" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <p className="text-sm font-semibold">Platform Hesaplarım</p>
                  <p className="text-xs text-muted-foreground">
                    Her platform için profil URL&apos;ni gir. Gelecekte bu bağlantılar üzerinden
                    profilini import edebileceksin.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {PLATFORM_IDS.map((id) => {
                    const style = PLATFORM_STYLES[id];
                    const saved = connections[id];
                    const draft = connectionDraft[id] ?? "";
                    const isDirty = draft !== (saved ?? "");
                    const err = connectionError[id];

                    return (
                      <Card key={id} className={`shadow-sm overflow-hidden ${style.accent}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.icon}`}>
                              <PlatformLogo platform={id} size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{PLATFORMS[id].label}</p>
                              {saved ? (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                                  ✓ Bağlı
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/60">Bağlı değil</span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1.5">
                            <input
                              type="url"
                              value={draft}
                              onChange={(e) => setConnectionDraft((prev) => ({ ...prev, [id]: e.target.value }))}
                              placeholder={PLATFORM_URL_PLACEHOLDERS[id]}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring transition-shadow"
                            />
                            {err && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 shrink-0" />{err}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={saved && !isDirty ? "outline" : "default"}
                              disabled={savingConnection === id || !draft.trim()}
                              onClick={() => saveConnection(id)}
                              className="gap-1.5 h-7 text-xs"
                            >
                              <Save className="h-3 w-3" />
                              {savingConnection === id ? "Kaydediliyor…" : saved && !isDirty ? "Kaydedildi" : "Kaydet"}
                            </Button>
                            {saved && (
                              <>
                                <a
                                  href={saved}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />Görüntüle
                                </a>
                                <button
                                  onClick={() => removeConnection(id)}
                                  disabled={deletingConnection === id}
                                  className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                                  title="Bağlantıyı kaldır"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Coming soon toast ──────────────────────────────────────── */}
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
    </div>
  );
}
