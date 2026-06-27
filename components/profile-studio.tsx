"use client";

// Profil Stüdyosu: Faz 1 (profil + uyarlama) + Faz 2 (portfolyo).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import {
  JOB_STATUSES,
  type JobStatus,
  type JobMatchResult,
} from "@/lib/validation/schemas/job";

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

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Kaydedildi",
  applied: "Başvuruldu",
  interview: "Görüşme",
  offer: "Teklif",
  rejected: "Reddedildi",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  saved: "bg-neutral-100 text-neutral-600",
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

type Tab = "profil" | "uyarlama" | "portfolyo" | "ilanlar";

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

export function ProfileStudio({
  initialProfile,
  initialSpendUsd,
  initialPortfolio,
  initialJobs,
}: {
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
  initialPortfolio: InitialPortfolio | null;
  initialJobs: JobRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const [spend, setSpend] = useState(initialSpendUsd);
  const [results, setResults] = useState<Partial<Record<PlatformId, AdaptOutput>>>({});
  const [adapting, setAdapting] = useState<PlatformId | null>(null);

  const [portfolio, setPortfolio] = useState<InitialPortfolio | null>(initialPortfolio);
  const [portfolioSlug, setPortfolioSlug] = useState(initialPortfolio?.slug ?? "");
  const [portfolioPublished, setPortfolioPublished] = useState(
    initialPortfolio?.published ?? false,
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
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

  async function saveProfile() {
    setSaveState("saving");
    setError("");
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
      setError(body?.error?.message ?? "Profil kaydedilemedi.");
      return;
    }
    setSaveState("saved");
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
    setSaving(true);
    setPortfolioError("");
    const res = await fetch("/api/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: portfolioSlug, published: portfolioPublished }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setPortfolioError(body?.error?.message ?? "Ayarlar kaydedilemedi.");
      setSaving(false);
      return;
    }
    setPortfolio((prev) =>
      prev ? { ...prev, slug: body.portfolio.slug, published: body.portfolio.published } : null,
    );
    setSaving(false);
  }

  async function adapt(platform: PlatformId) {
    setAdapting(platform);
    setError("");
    const res = await fetch("/api/adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "Uyarlama başarısız.");
      setAdapting(null);
      return;
    }
    setResults((prev) => ({ ...prev, [platform]: body.output }));
    if (typeof body.cost?.usd === "number") setSpend((s) => s + body.cost.usd);
    setAdapting(null);
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "profil", label: "Profil" },
    { id: "uyarlama", label: "Platform Uyarlama" },
    { id: "portfolyo", label: "Portfolyo Sitesi" },
    { id: "ilanlar", label: `İlanlar${jobs.length > 0 ? ` (${jobs.length})` : ""}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Profil Stüdyosu</h1>
        <Badge variant="secondary" title="Bu hesabın toplam harcaması">
          Harcama: {formatUsd(spend)}
        </Badge>
      </div>

      {/* Sekme navigasyonu */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profil sekmesi */}
      {activeTab === "profil" && (
        <Card>
          <CardHeader>
            <CardTitle>Çekirdek profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Başlık</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => { setHeadline(e.target.value); setSaveState("idle"); }}
                placeholder="ör. Senior Frontend Developer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Özet</Label>
              <Textarea
                id="summary"
                rows={5}
                value={summary}
                onChange={(e) => { setSummary(e.target.value); setSaveState("idle"); }}
                placeholder="Deneyimini, uzmanlığını ve öne çıkan sonuçlarını kısaca anlat."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Beceriler (virgülle ayır)</Label>
              <Input
                id="skills"
                value={skills}
                onChange={(e) => { setSkills(e.target.value); setSaveState("idle"); }}
                placeholder="React, TypeScript, Next.js"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <Button onClick={saveProfile} disabled={saveState === "saving"}>
                {saveState === "saving" ? "Kaydediliyor…" : "Profili kaydet"}
              </Button>
              {saveState === "saved" && (
                <span className="text-sm text-green-600">Kaydedildi.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform uyarlama sekmesi */}
      {activeTab === "uyarlama" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORM_IDS.map((id) => (
            <Card key={id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{PLATFORMS[id].label}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adapt(id)}
                  disabled={adapting === id || saveState !== "saved"}
                  title={saveState !== "saved" ? "Önce profili kaydet" : undefined}
                >
                  {adapting === id ? "Uyarlanıyor…" : "Uyarla"}
                </Button>
              </CardHeader>
              <CardContent>
                {results[id] ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{results[id]!.headline}</p>
                    <p className="whitespace-pre-wrap text-neutral-600">{results[id]!.body}</p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    Profili kaydedip &quot;Uyarla&quot;ya bas; {PLATFORMS[id].label} için optimize metin burada görünecek.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* İlanlar sekmesi */}
      {activeTab === "ilanlar" && (
        <div className="space-y-4">
          {/* İlan ekleme formu */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAddFormOpen((v) => !v); setAddError(""); }}
            >
              {addFormOpen ? "İptal" : "+ İlan Ekle"}
            </Button>
          </div>

          {addFormOpen && (
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="add-title">Başlık *</Label>
                  <Input
                    id="add-title"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="ör. Senior React Developer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="add-company">Şirket</Label>
                    <Input
                      id="add-company"
                      value={addCompany}
                      onChange={(e) => setAddCompany(e.target.value)}
                      placeholder="ör. Acme Corp"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="add-platform">Platform</Label>
                    <Input
                      id="add-platform"
                      value={addPlatform}
                      onChange={(e) => setAddPlatform(e.target.value)}
                      placeholder="ör. LinkedIn"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-description">İlan metni *</Label>
                  <Textarea
                    id="add-description"
                    rows={6}
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="İlanın tam metnini buraya yapıştır."
                  />
                </div>
                {addError && <p className="text-sm text-red-600">{addError}</p>}
                <Button onClick={addJob} disabled={adding || !addTitle.trim() || !addDescription.trim()}>
                  {adding ? "Ekleniyor…" : "Ekle"}
                </Button>
              </CardContent>
            </Card>
          )}

          {jobError && <p className="text-sm text-red-600">{jobError}</p>}

          {jobs.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4">
              Henüz ilan yok. &quot;+ İlan Ekle&quot; ile başla.
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-4 space-y-3">
                    {/* Başlık + skor */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium leading-tight">{job.title}</p>
                        {(job.company || job.platform) && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {[job.company, job.platform].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {job.match_score !== null && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          job.match_score >= 70
                            ? "bg-green-100 text-green-700"
                            : job.match_score >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-600"
                        }`}>
                          {job.match_score}/100
                        </span>
                      )}
                    </div>

                    {/* Kontroller */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[job.status]}`}
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
                      >
                        {matchingId === job.id ? "Eşleştiriliyor…" : "Eşleştir"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJob(job.id)}
                        disabled={deletingId === job.id}
                        className="text-neutral-400 hover:text-red-600 ml-auto"
                      >
                        {deletingId === job.id ? "…" : "Sil"}
                      </Button>
                    </div>

                    {/* Eşleştirme sonucu */}
                    {job.match_result && (
                      <div className="rounded-lg bg-neutral-50 p-3 space-y-2 text-sm border">
                        <p className="text-neutral-600">{job.match_result.summary}</p>
                        {job.match_result.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1">Güçlü yönler</p>
                            <ul className="space-y-0.5">
                              {job.match_result.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-neutral-600">· {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {job.match_result.gaps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">Eksikler</p>
                            <ul className="space-y-0.5">
                              {job.match_result.gaps.map((g, i) => (
                                <li key={i} className="text-xs text-neutral-600">· {g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Portfolyo sekmesi */}
      {activeTab === "portfolyo" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolyo Sitesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-500">
                Profilinden otomatik bir portfolyo sayfası oluştur ve herkese açık bir bağlantıyla paylaş.
              </p>

              <Button
                onClick={generatePortfolio}
                disabled={generating || saveState !== "saved"}
                title={saveState !== "saved" ? "Önce profili kaydet" : undefined}
              >
                {generating
                  ? "Üretiliyor…"
                  : portfolio?.content
                    ? "Yeniden Üret"
                    : "Portfolyo Üret"}
              </Button>

              {portfolioError && <p className="text-sm text-red-600">{portfolioError}</p>}

              {portfolio?.content && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio-slug">Sayfa adresi (slug)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">/p/</span>
                      <Input
                        id="portfolio-slug"
                        value={portfolioSlug}
                        onChange={(e) => setPortfolioSlug(e.target.value.toLowerCase())}
                        placeholder="ör. ali-veli-developer"
                        className="max-w-xs"
                      />
                    </div>
                    <p className="text-xs text-neutral-400">
                      Yalnızca küçük harf, rakam ve tire. Min 3 karakter.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="portfolio-published"
                      type="checkbox"
                      checked={portfolioPublished}
                      onChange={(e) => setPortfolioPublished(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    <Label htmlFor="portfolio-published">Herkese açık yayınla</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={savePortfolioSettings} disabled={saving} variant="outline">
                      {saving ? "Kaydediliyor…" : "Ayarları kaydet"}
                    </Button>
                    {portfolio.published && (
                      <a
                        href={`/p/${portfolio.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Sayfayı görüntüle →
                      </a>
                    )}
                  </div>

                  <div className="rounded-lg border bg-neutral-50 p-4 space-y-3 text-sm">
                    <p className="font-semibold">{portfolio.content.headline}</p>
                    <p className="text-neutral-600 whitespace-pre-wrap line-clamp-4">
                      {portfolio.content.bio}
                    </p>
                    {portfolio.content.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {portfolio.content.skills.slice(0, 8).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
                          >
                            {s}
                          </span>
                        ))}
                        {portfolio.content.skills.length > 8 && (
                          <span className="text-xs text-neutral-400">
                            +{portfolio.content.skills.length - 8} daha
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
