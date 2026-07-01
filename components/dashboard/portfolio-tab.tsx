"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const { applyCredits, triggerComingSoon } = useDashboard();
  const t = useTranslations("portfolio");
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
    if (!res.ok) {
      setPortfolioError(body?.error?.message ?? t("errorGenerate"));
      if (res.status === 402) triggerComingSoon(); // yetersiz kredi → "Kredi al" nudge
      setGenerating(false); return;
    }
    const p = body.portfolio;
    setPortfolio({ slug: p.slug, published: p.published, content: p.content });
    setPortfolioSlug(p.slug);
    setPortfolioPublished(p.published);
    if (body.credits) applyCredits(body.credits);
    setGenerating(false);
  }

  async function savePortfolioSettings() {
    setSavingPortfolio(true); setPortfolioError("");
    const res = await fetch("/api/portfolio", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: portfolioSlug, published: portfolioPublished }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setPortfolioError(body?.error?.message ?? t("errorSaveSettings")); setSavingPortfolio(false); return; }
    setPortfolio((prev) => prev ? { ...prev, slug: body.portfolio.slug, published: body.portfolio.published } : null);
    setSavingPortfolio(false);
  }

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!profileSaved && !portfolio?.content && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />{t("saveProfileFirst")}
            </div>
          )}

          <Button onClick={generatePortfolio} disabled={generating || (!profileSaved && !portfolio?.content)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {generating ? t("generating") : portfolio?.content ? t("regenerate") : t("generate")}
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
                      <span className="text-xs text-muted-foreground self-center">{t("moreSkills", { count: portfolio.content.skills.length - 8 })}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio-slug">{t("pageAddress")}</Label>
                  <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                    <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-input select-none py-2">/p/</span>
                    <input id="portfolio-slug" value={portfolioSlug}
                      onChange={(e) => setPortfolioSlug(e.target.value.toLowerCase())}
                      placeholder={t("slugPlaceholder")}
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer pb-2">
                    <div onClick={() => setPortfolioPublished((v) => !v)}
                      className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${portfolioPublished ? "bg-primary" : "bg-muted-foreground/30"}`}>
                      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${portfolioPublished ? "translate-x-4" : ""}`} />
                    </div>
                    <span className="text-sm font-medium">{t("public")}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={savePortfolioSettings} disabled={savingPortfolio} variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingPortfolio ? t("saving") : t("saveSettings")}
                </Button>
                {portfolio.published && (
                  <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {t("viewPage")} <ExternalLink className="h-3.5 w-3.5" />
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
