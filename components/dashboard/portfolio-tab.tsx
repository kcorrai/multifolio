"use client";

import { useState } from "react";
import { Sparkles, Save, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ELEVATED, type InitialPortfolio } from "./shared";
import { useDashboard } from "./dashboard-context";

export function PortfolioTab({
  profileSaved, initialPortfolio,
}: {
  profileSaved: boolean;
  initialPortfolio: InitialPortfolio | null;
}) {
  const { addSpend } = useDashboard();
  const [portfolio, setPortfolio] = useState<InitialPortfolio | null>(initialPortfolio);
  const [portfolioSlug, setPortfolioSlug] = useState(initialPortfolio?.slug ?? "");
  const [portfolioPublished, setPortfolioPublished] = useState(initialPortfolio?.published ?? false);
  const [generating, setGenerating] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");

  async function generatePortfolio() {
    setGenerating(true); setPortfolioError("");
    const res = await fetch("/api/portfolio/generate", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setPortfolioError(body?.error?.message ?? "Portfolyo üretilemedi."); setGenerating(false); return; }
    const p = body.portfolio;
    setPortfolio({ slug: p.slug, published: p.published, content: p.content });
    setPortfolioSlug(p.slug);
    setPortfolioPublished(p.published);
    if (typeof body.cost?.usd === "number") addSpend(body.cost.usd);
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

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm ${ELEVATED}`}>
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
  );
}
