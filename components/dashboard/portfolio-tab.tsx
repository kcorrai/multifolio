"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TestimonialsManager } from "./testimonials-manager";
import { LeadsManager } from "./leads-manager";
import { getSafeEmbed } from "@/lib/portfolio/embed";
import { Sparkles, Save, AlertCircle, ExternalLink, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import {
  PORTFOLIO_PRESETS, PORTFOLIO_ACCENTS, ACCENT_HEX, portfolioTheme,
  type PortfolioPreset,
} from "@/lib/portfolio/theme";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import { ELEVATED, type InitialPortfolio } from "./shared";
import { useDashboard } from "./dashboard-context";

export function PortfolioTab({
  profileSaved, initialPortfolio, projectsNeedSync = false,
}: {
  profileSaved: boolean;
  initialPortfolio: InitialPortfolio | null;
  /** Sunucu profilden taze proje grupları enjekte etti (kayıtlıdan farklı) → Kaydet'e
      basılınca public sayfaya yansır. Başlangıçta "kaydedilmemiş" işaretle. */
  projectsNeedSync?: boolean;
}) {
  const { applyCredits, triggerComingSoon } = useDashboard();
  const t = useTranslations("portfolio");
  const [content, setContent] = useState<PortfolioContent | null>(initialPortfolio?.content ?? null);
  const [slug, setSlug] = useState(initialPortfolio?.slug ?? "");
  const [published, setPublished] = useState(initialPortfolio?.published ?? false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(projectsNeedSync);
  // Sunucunun enjekte ettiği taze proje grupları henüz kaydedilmedi mi (kaydetme sonrası temizlenir).
  const [pendingSync, setPendingSync] = useState(projectsNeedSync);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  // İçerik alanını değiştir + kaydedilmemiş işaretle.
  function patch(next: Partial<PortfolioContent>) {
    setContent((prev) => (prev ? { ...prev, ...next } : prev));
    setDirty(true);
  }

  async function generatePortfolio() {
    setGenerating(true); setError("");
    const res = await fetch("/api/portfolio/generate", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("errorGenerate"));
      if (res.status === 402) triggerComingSoon();
      setGenerating(false); return;
    }
    const p = body.portfolio;
    setContent(p.content); setSlug(p.slug); setPublished(p.published); setDirty(false);
    if (body.credits) applyCredits(body.credits);
    setGenerating(false);
  }

  async function save() {
    if (!content) return;
    setSaving(true); setError("");
    const res = await fetch("/api/portfolio", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, published, content }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("errorSaveSettings")); setSaving(false); return; }
    // Sunucu projectGroups'u canlı profilden yeniden kurar (ücretsiz senkron) → dönen
    // içeriği uygula ki import edilen projeler "By project" modunda anında görünsün.
    if (body.portfolio.content) setContent(body.portfolio.content);
    setSlug(body.portfolio.slug); setPublished(body.portfolio.published); setDirty(false); setPendingSync(false);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!profileSaved && !content && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />{t("saveProfileFirst")}
            </div>
          )}

          <Button onClick={generatePortfolio} disabled={generating || (!profileSaved && !content)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {generating ? t("generating") : content ? t("regenerate") : t("generate")}
            <CreditCost kind="portfolio_generation" />
          </Button>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {content && (
            <div className="space-y-6 border-t pt-5">
              {/* ── Canlı önizleme (seçili tema) ─────────────────────── */}
              <ThemePreview content={content} />

              {/* ── Tema: preset + vurgu rengi ───────────────────────── */}
              <div className="space-y-3">
                <Label>{t("themeTitle")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PORTFOLIO_PRESETS.map((preset) => (
                    <PresetCard
                      key={preset}
                      preset={preset}
                      label={t(`preset.${preset}`)}
                      selected={content.theme.preset === preset}
                      onSelect={() => patch({ theme: { ...content.theme, preset } })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{t("accentLabel")}</span>
                  <div className="flex gap-1.5">
                    {PORTFOLIO_ACCENTS.map((accent) => (
                      <button
                        key={accent}
                        onClick={() => patch({ theme: { ...content.theme, accent } })}
                        aria-label={accent}
                        className={`h-6 w-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                          content.theme.accent === accent ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/40" : ""
                        }`}
                        style={{ backgroundColor: ACCENT_HEX[accent] }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Görsel gösterimi: düz galeri veya proje-proje gruplu ─── */}
              <div className="space-y-2">
                <Label>{t("displayTitle")}</Label>
                <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                  {(["gallery", "projects"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => patch({ layout: mode })}
                      aria-pressed={content.layout === mode}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        content.layout === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`display.${mode}`)}
                    </button>
                  ))}
                </div>
                {content.layout === "projects" && pendingSync && (content.media.projectGroups?.length ?? 0) > 0 ? (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {t("displaySyncPending", { count: content.media.projectGroups!.length })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    {content.layout === "projects" && (content.media.projectGroups?.length ?? 0) === 0
                      ? t("displayNoProjects")
                      : t("displayHint")}
                  </p>
                )}
              </div>

              {/* ── İçerik düzenleme ─────────────────────────────────── */}
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-headline">{t("headlineLabel")}</Label>
                  <Input id="pf-headline" value={content.headline} maxLength={220}
                    onChange={(e) => patch({ headline: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-bio">{t("bioLabel")}</Label>
                  <Textarea id="pf-bio" rows={5} value={content.bio} maxLength={2000}
                    onChange={(e) => patch({ bio: e.target.value })} className="resize-none" />
                </div>
                {/* İletişim / işe-al CTA hedefi (public sayfada buton) */}
                <div className="space-y-1.5">
                  <Label>{t("contactTitle")}</Label>
                  <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
                  <Input type="email" inputMode="email" value={content.contactEmail ?? ""} maxLength={200}
                    placeholder={t("contactEmailLabel")} aria-label={t("contactEmailLabel")}
                    onChange={(e) => patch({ contactEmail: e.target.value })} />
                  {/* Canlı doğrulama: public sayfadaki regex ile aynı → sessiz CTA kaybını önle. */}
                  {(content.contactEmail ?? "").trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((content.contactEmail ?? "").trim()) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{t("contactEmailInvalid")}</p>
                  )}
                  <Input type="url" inputMode="url" value={content.contactUrl ?? ""} maxLength={300}
                    placeholder={t("contactUrlLabel")} aria-label={t("contactUrlLabel")}
                    onChange={(e) => patch({ contactUrl: e.target.value })} />
                  {(content.contactUrl ?? "").trim() && !/^https?:\/\//i.test((content.contactUrl ?? "").trim()) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{t("contactUrlInvalid")}</p>
                  )}
                </div>
                {/* Canlı demo gömme (opsiyonel; yalnız YouTube/Vimeo/Loom/Figma) */}
                <div className="space-y-1.5">
                  <Label>{t("embedTitle")}</Label>
                  <p className="text-xs text-muted-foreground">{t("embedHint")}</p>
                  <Input type="url" inputMode="url" value={content.embedUrl ?? ""} maxLength={500}
                    placeholder={t("embedPlaceholder")} aria-label={t("embedTitle")}
                    onChange={(e) => patch({ embedUrl: e.target.value })} />
                  {(content.embedUrl ?? "").trim() && !getSafeEmbed(content.embedUrl) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{t("embedInvalid")}</p>
                  )}
                </div>
              </div>

              {/* ── Galeri (bağlı profillerden; kaldırılabilir) ──────── */}
              {content.media.gallery.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("galleryTitle", { count: content.media.gallery.length })}</Label>
                  <p className="text-xs text-muted-foreground">{t("galleryHint")}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {(() => {
                      const imgs: LightboxImage[] = content.media.gallery.map((g) => ({ src: g.url, alt: g.caption || "" }));
                      return content.media.gallery.map((item, i) => (
                        <div key={item.url} className="relative group aspect-square">
                          {/* Tıklanınca lightbox'ta büyür + galeri içinde gezinme. */}
                          <button type="button" onClick={() => setLightbox({ images: imgs, index: i })} title={item.caption} className="block h-full w-full cursor-zoom-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={item.caption}
                              className="h-full w-full rounded-lg object-cover border border-border" />
                          </button>
                          <button
                            onClick={() => patch({ media: { ...content.media, gallery: content.media.gallery.filter((g) => g.url !== item.url) } })}
                            aria-label={t("removeImage")}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border border-border shadow flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* ── Adres + yayın ────────────────────────────────────── */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio-slug">{t("pageAddress")}</Label>
                  <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                    <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-input select-none py-2">/p/</span>
                    <input id="portfolio-slug" value={slug}
                      onChange={(e) => { setSlug(e.target.value.toLowerCase()); setDirty(true); }}
                      placeholder={t("slugPlaceholder")}
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
                </div>
                <div className="flex items-end">
                  <button type="button" aria-pressed={published}
                    onClick={() => { setPublished((v) => !v); setDirty(true); }}
                    className="flex items-center gap-3 cursor-pointer pb-2">
                    <span className={`relative h-5 w-9 rounded-full transition-colors ${published ? "bg-primary" : "bg-muted-foreground/30"}`}>
                      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${published ? "translate-x-4" : ""}`} />
                    </span>
                    <span className="text-sm font-medium">{t("public")}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={save} disabled={saving || !dirty} className="gap-2">
                  {saving ? <Save className="h-4 w-4 animate-pulse" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {saving ? t("saving") : dirty ? t("saveSettings") : t("saved")}
                </Button>
                {published && slug && (
                  <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {t("viewPage")} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {content && <TestimonialsManager slug={slug} published={published} />}
      {content && <LeadsManager />}

      {/* Galeri fotosu lightbox (ileri/geri gezinme). */}
      {lightbox && (
        <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// Seçili tema tokenlarıyla küçük canlı önizleme (public sayfanın minyatürü).
function ThemePreview({ content }: { content: PortfolioContent }) {
  const { vars } = portfolioTheme(content.theme.preset, content.theme.accent);
  const tint = "color-mix(in srgb, var(--pf-accent) 14%, transparent)";
  return (
    <div
      className="rounded-2xl border border-[var(--pf-border)] overflow-hidden bg-[var(--pf-bg)] text-[var(--pf-text)]"
      style={vars}
    >
      <div className="h-1 w-full bg-[var(--pf-accent)]" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          {content.media.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.media.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-[var(--pf-border)]" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-[var(--pf-surface)] border border-[var(--pf-border)]" />
          )}
          <p className="text-lg font-bold leading-tight line-clamp-2">{content.headline}</p>
        </div>
        {content.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.skills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-full px-2 py-0.5 text-xs font-medium text-[var(--pf-accent)]" style={{ backgroundColor: tint }}>{s}</span>
            ))}
          </div>
        )}
        {content.media.gallery.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            {content.media.gallery.slice(0, 4).map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={g.url} src={g.url} alt="" className="aspect-square w-full rounded-md object-cover border border-[var(--pf-border)]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Preset seçim kartı: preset renk şeridi + adı.
function PresetCard({
  preset, label, selected, onSelect,
}: {
  preset: PortfolioPreset; label: string; selected: boolean; onSelect: () => void;
}) {
  const { vars } = portfolioTheme(preset, "blue");
  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-border/80"
      }`}
    >
      <div className="rounded-lg overflow-hidden border border-[var(--pf-border)]" style={vars}>
        <div className="h-1.5 bg-[var(--pf-accent)]" />
        <div className="h-10 bg-[var(--pf-bg)] p-1.5 flex items-end gap-1">
          <span className="h-3 w-3 rounded-full bg-[var(--pf-accent)]" />
          <span className="h-2 flex-1 rounded bg-[var(--pf-surface)] border border-[var(--pf-border)]" />
        </div>
      </div>
      <span className="mt-1.5 block text-xs font-medium text-center">{label}</span>
    </button>
  );
}
