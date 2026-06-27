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

type Tab = "profil" | "uyarlama" | "portfolyo";

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

export function ProfileStudio({
  initialProfile,
  initialSpendUsd,
  initialPortfolio,
}: {
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
  initialPortfolio: InitialPortfolio | null;
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "profil", label: "Profil" },
    { id: "uyarlama", label: "Platform Uyarlama" },
    { id: "portfolyo", label: "Portfolyo Sitesi" },
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
