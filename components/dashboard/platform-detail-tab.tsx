"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft, Sparkles, Save, ExternalLink, Trash2, AlertCircle,
  Briefcase, Clock, Lightbulb, User, Pencil, Download, RefreshCw, Puzzle, ChevronDown, PlayCircle, Languages, Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { PLATFORMS, type PlatformId } from "@/lib/ai/platforms";
import { EXTENSION_STORE_URL } from "@/lib/extension";
import { ExtensionGuideModal } from "./extension-guide-modal";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";

// Portfolyo öğelerini (görselli) lightbox dizisine çevirir (index eşleşmesi için süz).
function toLightbox(items: { imageUrl: string | null; title: string }[]): LightboxImage[] {
  return items.filter((p) => p.imageUrl).map((p) => ({ src: p.imageUrl as string, alt: p.title }));
}
import type { AdaptSource } from "@/lib/validation/schemas/adapt";
import type { PlatformProfileRow } from "@/lib/validation/schemas/platform-profile";
import type { ProposalRow } from "@/lib/validation/schemas/proposal";
import {
  ELEVATED, PLATFORM_STYLES, PLATFORM_URL_PLACEHOLDERS,
  STATUS_DOT, scoreColor, scoreBarColor, type JobRow, type AdaptOutput, type InitialProfile,
} from "./shared";
import { CopyButton } from "./copy-button";
import { HealthWarnings } from "./health-warnings";
import { useDashboard } from "./dashboard-context";
import { useAdapt } from "./use-adapt";

// Sunucudan yapılandırılmış çekim yapılabilen platformlar; kalanı (Upwork/Fiverr)
// bot duvarı nedeniyle yalnız tarayıcı uzantısıyla dolar. Armut'ta public veri yok.
const SERVER_FETCHABLE: PlatformId[] = ["bionluk", "linkedin"];
const EXTENSION_ONLY: PlatformId[] = ["upwork", "fiverr"];

export function PlatformDetailTab({
  platform, profile, initialPlatformProfile, connectionUrl, jobs: initialJobs, proposals, initialAdaptResult,
}: {
  platform: PlatformId;
  profile: InitialProfile | null;
  initialPlatformProfile: PlatformProfileRow | null;
  connectionUrl: string | null;
  jobs: JobRow[];
  proposals: ProposalRow[];
  initialAdaptResult: AdaptOutput | null;
}) {
  const profileSaved = profile !== null;
  const t = useTranslations("platforms");
  const ta = useTranslations("adapt");
  const tc = useTranslations("accounts");
  const tj = useTranslations("jobs");
  const locale = useLocale();
  const style = PLATFORM_STYLES[platform];
  const { adaptResults, applyCredits, setConnectionsCount } = useDashboard();
  const { adapt, adapting, error: adaptError } = useAdapt();
  // Oturum içi taze üretim öncelikli; yenilemede DB'deki kalıcı kayıt devralır.
  const adaptResult = adaptResults[platform] ?? initialAdaptResult ?? undefined;

  // ── Bağlantı (tek platform) ──────────────────────────────────────────
  const [saved, setSaved] = useState<string | null>(connectionUrl);
  const [draft, setDraft] = useState(connectionUrl ?? "");
  const [savingConn, setSavingConn] = useState(false);
  const [deletingConn, setDeletingConn] = useState(false);
  const [connError, setConnError] = useState("");
  const isDirty = draft !== (saved ?? "");

  async function saveConnection() {
    const url = draft.trim();
    setSavingConn(true); setConnError("");
    const res = await fetch("/api/platform-connections", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, profile_url: url }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setConnError(body?.error?.message ?? tc("errorSave")); setSavingConn(false); return; }
    if (!saved) setConnectionsCount((c) => c + 1);
    setSaved(url); setSavingConn(false);
    // Emek azaltma: sunucudan çekilebilen platformda (Bionluk/LinkedIn) URL
    // kaydedilince veriyi otomatik çek (kullanıcı ayrı "Çek" tıklamasın).
    if (SERVER_FETCHABLE.includes(platform) && url) void syncPlatformProfile();
  }

  async function removeConnection() {
    setDeletingConn(true); setConnError("");
    const res = await fetch("/api/platform-connections", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setConnError(body?.error?.message ?? tc("errorDelete")); setDeletingConn(false); return;
    }
    if (saved) setConnectionsCount((c) => Math.max(0, c - 1));
    setSaved(null); setDraft(""); setDeletingConn(false);
  }

  // ── Platform profil verisi (bağlı URL'den çekim) ─────────────────────
  const [platformProfile, setPlatformProfile] = useState<PlatformProfileRow | null>(initialPlatformProfile);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [ppTranslating, setPpTranslating] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const canFetch = SERVER_FETCHABLE.includes(platform);
  const isExtensionOnly = EXTENSION_ONLY.includes(platform);

  // Hero'da tüm public veriyi göster/gizle (özet + tüm skills/portfolyo).
  const [heroExpanded, setHeroExpanded] = useState(false);

  // ── Uyarlama kaynağı seçimi (çekirdek / platform / ikisi) ────────────
  // Seçenekler mevcut veriye göre: platform verisi çekilmişse platform/both,
  // çekirdek profil kayıtlıysa core/both açık. İkisi de yoksa uyarlama disabled.
  const hasPlatformData = !!platformProfile;
  const sourceOptions: AdaptSource[] = [
    ...(hasPlatformData && profileSaved ? (["both"] as AdaptSource[]) : []),
    ...(hasPlatformData ? (["platform"] as AdaptSource[]) : []),
    ...(profileSaved ? (["core"] as AdaptSource[]) : []),
  ];
  const [source, setSource] = useState<AdaptSource>("both");
  const effectiveSource: AdaptSource | null =
    (sourceOptions.includes(source) ? source : sourceOptions[0]) ?? null;

  async function syncPlatformProfile() {
    setSyncing(true); setSyncError("");
    const res = await fetch("/api/platform-profiles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setSyncError(body?.error?.message ?? tc("errorSave")); setSyncing(false); return; }
    setPlatformProfile(body.profile as PlatformProfileRow);
    setSyncing(false);
  }

  // Bağlı profili UI diline çevir + KALICI kaydet (PATCH platform_profiles).
  // Uyarı: sonraki "Yenile" platformdan orijinal dilde geri çeker (beklenen davranış).
  async function translateConnected() {
    if (!platformProfile) return;
    setPpTranslating(true); setSyncError("");
    try {
      const tr = await fetch("/api/profile/import/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: platformProfile.headline, summary: platformProfile.summary, skills: platformProfile.skills }),
      });
      const trBody = await tr.json().catch(() => null);
      if (!tr.ok) { setSyncError(trBody?.error?.message ?? tc("errorSave")); return; }
      const d = trBody.draft as { headline: string; summary: string; skills: string[] };
      const save = await fetch("/api/platform-profiles", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, headline: d.headline, summary: d.summary, skills: d.skills }),
      });
      const saveBody = await save.json().catch(() => null);
      if (!save.ok) { setSyncError(saveBody?.error?.message ?? tc("errorSave")); return; }
      setPlatformProfile(saveBody.profile as PlatformProfileRow);
    } finally {
      setPpTranslating(false);
    }
  }

  // ── Eşleşen işler (platform-filtreli) ────────────────────────────────
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  // ── Teklifler → iş başlığı eşlemesi ──────────────────────────────────
  const jobTitleById = new Map(jobs.map((j) => [j.id, j.title]));
  const tips = t.raw(`tips.${platform}`) as string[];

  return (
    <div className="space-y-5">
      <Link href="/dashboard/platforms" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />{t("detail.back")}
      </Link>

      {/* ── HERO: platformdaki public profil verisi (en üstte, büyük) ── */}
      <section className={`pd-in relative overflow-hidden rounded-3xl border border-border bg-card bg-gradient-to-br ${style.hero}`}>
        <div className="p-5 sm:p-7 space-y-5">
          {/* Üst şerit: platform kimliği + bağlantı durumu + yenile */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${style.icon}`}>
                <PlatformLogo platform={platform} size={20} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{PLATFORMS[platform].label}</h2>
              {saved ? (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{tc("connected")}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">{tc("notConnected")}</span>
              )}
            </div>
            {platformProfile && (
              <div className="flex items-center gap-2">
                {/* Çeviri: bağlı profili UI diline çevir + kalıcı kaydet. */}
                <Button size="sm" variant="outline" onClick={translateConnected} disabled={ppTranslating} title={t("detail.translateSaveHint")} className="gap-1.5 h-8 text-xs bg-card/70">
                  <Languages className={`h-3.5 w-3.5 ${ppTranslating ? "animate-pulse" : ""}`} />
                  {ppTranslating ? t("detail.translating") : t("detail.translateSave")}
                </Button>
                {canFetch ? (
                  <Button size="sm" variant="outline" onClick={syncPlatformProfile} disabled={syncing} className="gap-1.5 h-8 text-xs bg-card/70">
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? t("detail.syncing") : t("detail.syncRefresh")}
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <Puzzle className="h-3.5 w-3.5" />{t("detail.syncExtensionUpdated")}
                  </span>
                )}
              </div>
            )}
          </div>

          {syncError && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{syncError}</span>
              {/* Çekim başarısız (ör. LinkedIn authwall) → elle içe aktarmaya yönlendir. */}
              <Link href="/dashboard/import" className="ml-auto inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline">
                {t("detail.syncFailedCta")}<ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {platformProfile ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                {platformProfile.avatar_url ? (
                  // Platformdan gelen dış görsel — tıklanınca lightbox'ta büyür.
                  <button type="button" onClick={() => setLightbox({ images: [{ src: platformProfile.avatar_url as string, alt: PLATFORMS[platform].label }], index: 0 })} className="shrink-0 cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={platformProfile.avatar_url}
                      alt={PLATFORMS[platform].label}
                      className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ${style.ring} shadow-xl`}
                    />
                  </button>
                ) : (
                  <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card flex items-center justify-center ring-4 ${style.ring} shrink-0`}>
                    <PlatformLogo platform={platform} size={34} />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
                    {platformProfile.headline}
                  </h3>
                  {platformProfile.summary && (
                    <p className={`text-sm text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-wrap ${heroExpanded ? "" : "line-clamp-3"}`}>
                      {platformProfile.summary}
                    </p>
                  )}
                  {(() => {
                    const hasMore =
                      (platformProfile.summary?.length ?? 0) > 180 ||
                      platformProfile.skills.length > 14 ||
                      platformProfile.portfolio.length > 8;
                    return hasMore ? (
                      <button
                        onClick={() => setHeroExpanded((v) => !v)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#00F0FF] hover:underline cursor-pointer"
                      >
                        {heroExpanded ? t("detail.showLess") : t("detail.showAll")}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${heroExpanded ? "rotate-180" : ""}`} />
                      </button>
                    ) : null;
                  })()}
                  <p className="text-[11px] text-muted-foreground/70">
                    {t("detail.syncedAt", { date: new Date(platformProfile.fetched_at).toLocaleString(locale) })}
                  </p>
                </div>
              </div>

              {platformProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(heroExpanded ? platformProfile.skills : platformProfile.skills.slice(0, 14)).map((s, i) => (
                    <span
                      key={s}
                      className="pd-chip rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold"
                      style={{ animationDelay: `${120 + i * 45}ms` }}
                    >
                      {s}
                    </span>
                  ))}
                  {!heroExpanded && platformProfile.skills.length > 14 && (
                    <span className="text-xs text-muted-foreground/60 self-center">+{platformProfile.skills.length - 14}</span>
                  )}
                </div>
              )}

              {platformProfile.portfolio.length > 0 && (() => {
                const imgs = toLightbox(heroExpanded ? platformProfile.portfolio : platformProfile.portfolio.slice(0, 8));
                return (
                  <div className="flex flex-wrap gap-2.5">
                    {imgs.map((img, i) => (
                      <button
                        key={img.src + i}
                        type="button"
                        onClick={() => setLightbox({ images: imgs, index: i })}
                        title={img.alt}
                        className="pd-chip cursor-zoom-in"
                        style={{ animationDelay: `${240 + i * 60}ms` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-border transition-transform duration-200 hover:scale-105 hover:shadow-lg"
                        />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              {canFetch ? (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-card/70 border border-border flex items-center justify-center mb-3">
                    <Download className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {saved
                      ? t("detail.syncEmptyHint", { platform: PLATFORMS[platform].label })
                      : t("detail.syncNoUrlHint")}
                  </p>
                  <Button onClick={syncPlatformProfile} disabled={!saved || syncing} className="mt-4 gap-2">
                    <Download className="h-4 w-4" />
                    {syncing ? t("detail.syncing") : t("detail.syncFetch")}
                  </Button>
                </>
              ) : isExtensionOnly ? (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-card/70 border border-border flex items-center justify-center mb-3">
                    <Puzzle className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t("detail.syncExtensionHint", { platform: PLATFORMS[platform].label })}
                  </p>
                  {/* Uzantı canlı: birincil "Yükle" + "Nasıl kullanılır?" rehber modalı. */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button asChild size="sm" className="gap-1.5">
                      <a href={EXTENSION_STORE_URL} target="_blank" rel="noopener noreferrer">
                        <Puzzle className="h-3.5 w-3.5" />{t("detail.extensionInstall")}
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setGuideOpen(true)}>
                      <PlayCircle className="h-3.5 w-3.5" />{t("detail.extensionHowTo")}
                    </Button>
                  </div>
                  {guideOpen && <ExtensionGuideModal platform={platform} onClose={() => setGuideOpen(false)} />}
                </>
              ) : (
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("detail.noPublicData", { platform: PLATFORMS[platform].label })}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Uyarlanmış + Çekirdek profil yan yana ────────────────────── */}
      <div className={`grid gap-5 ${profile ? "lg:grid-cols-2" : ""}`}>
        <section className="pd-in space-y-3" style={{ animationDelay: "90ms" }}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F0FF]" />{t("detail.profileSection")}
          </h3>
          {!profileSaved && !hasPlatformData && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />{ta("saveProfileFirst")}
            </div>
          )}
          {adaptError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{adaptError}
            </div>
          )}
          <Card className={`shadow-sm overflow-hidden ${ELEVATED} ${style.accent}`}>
            <CardHeader className="pb-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{t("detail.profileHint")}</p>
                <Button size="sm" variant={adaptResult ? "outline" : "default"}
                  onClick={() => effectiveSource && adapt(platform, effectiveSource)}
                  disabled={adapting === platform || !effectiveSource}
                  className="gap-1.5 h-7 text-xs shrink-0">
                  <Sparkles className="h-3 w-3" />
                  {adapting === platform ? ta("adapting") : adaptResult ? ta("refresh") : ta("adaptAction")}
                  <CreditCost kind="adaptation" />
                </Button>
              </div>
              {/* Yeniden üretme veri kaybı uyarısı: mevcut uyarlanmış metin üzerine yazılır. */}
              {adaptResult && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />{t("detail.regenerateWarn")}
                </p>
              )}
              {/* Kaynak seçici: uyarlama neyden üretilsin (çekirdek / platform / ikisi). */}
              {sourceOptions.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground shrink-0">{t("detail.sourceLabel")}</span>
                  <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                    {sourceOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSource(opt)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                          effectiveSource === opt
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(`detail.source_${opt}`, { platform: PLATFORMS[platform].label })}
                      </button>
                    ))}
                  </div>
                </div>
              ) : effectiveSource ? (
                // Tek kaynak: seçici gizli ama hangi verinin kullanıldığı şeffaf kalsın.
                <p className="text-[11px] text-muted-foreground">
                  {t("detail.sourceLabel")}{" "}
                  <span className="font-medium text-foreground">
                    {t(`detail.source_${effectiveSource}`, { platform: PLATFORMS[platform].label })}
                  </span>
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {adaptResult ? (
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">{adaptResult.headline}</p>
                    <CopyButton text={`${adaptResult.headline}\n\n${adaptResult.body}`} />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{adaptResult.body}</p>
                  <HealthWarnings text={`${adaptResult.headline}\n${adaptResult.body}`} platform={platform} />
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 border border-dashed p-4 text-center space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    {effectiveSource ? ta("emptyState", { platform: PLATFORMS[platform].label }) : ta("saveProfileFirst")}
                  </p>
                  {/* Uyarlanabilir kaynak varken (çekirdek veya platform) CTA başlıkta.
                      Hiç kaynak yoksa "profil kur" CTA'sı burada. */}
                  {!effectiveSource && (
                    <Button asChild size="sm" className="gap-1.5 h-7 text-xs">
                      <Link href="/dashboard/import">{t("detail.setupProfileCta")}</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {profile && (
          <section className="pd-in space-y-3" style={{ animationDelay: "150ms" }}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />{t("detail.sourceProfileSection")}
            </h3>
            <Card className={`shadow-sm overflow-hidden ${ELEVATED}`}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-3.5">
                  {profile.avatarUrl ? (
                    // İçe aktarmadan gelen dış görsel — tıklanınca lightbox'ta büyür.
                    <button type="button" onClick={() => setLightbox({ images: [{ src: profile.avatarUrl as string, alt: t("detail.sourceProfileSection") }], index: 0 })} className="shrink-0 cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profile.avatarUrl}
                        alt={t("detail.sourceProfileSection")}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-[#00F0FF]/30"
                      />
                    </button>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-snug">{profile.headline}</p>
                      <Link
                        href="/dashboard/profile"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Pencil className="h-3 w-3" />{t("detail.editProfile")}
                      </Link>
                    </div>
                    {profile.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-3">{profile.summary}</p>
                    )}
                  </div>
                </div>
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 12).map((s) => (
                      <span key={s} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{s}</span>
                    ))}
                    {profile.skills.length > 12 && (
                      <span className="text-[11px] text-muted-foreground/60 self-center">+{profile.skills.length - 12}</span>
                    )}
                  </div>
                )}
                {profile.portfolio.length > 0 && (() => {
                  const imgs = toLightbox(profile.portfolio.slice(0, 5));
                  return (
                    <div className="flex gap-2">
                      {imgs.map((img, i) => (
                        <button key={img.src + i} type="button" onClick={() => setLightbox({ images: imgs, index: i })} title={img.alt} className="cursor-zoom-in">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="h-14 w-14 rounded-lg object-cover border border-border transition-transform hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <p className="text-[11px] text-muted-foreground/70 border-t border-border pt-2.5">{t("detail.sourceProfileHint")}</p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* ── Bölüm: Projeler (bu platformdan içe aktarılan yapılandırılmış projeler) ── */}
      {profile && profile.projects.length > 0 && (
        <section className="pd-in space-y-3" style={{ animationDelay: "180ms" }}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Images className="h-4 w-4 text-muted-foreground" />{t("detail.projectsSection")}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.projects.map((p, pi) => {
              const imgs: LightboxImage[] = p.images
                .filter((im) => im.url)
                .map((im) => ({ src: im.url, alt: im.caption || p.title }));
              return (
                <Card key={pi} className={`shadow-sm ${ELEVATED}`}>
                  <CardContent className="pt-5 space-y-3">
                    <div>
                      <h4 className="text-base font-bold leading-snug">{p.title}</h4>
                      {p.role && <p className="mt-0.5 text-xs font-semibold text-[#00F0FF]/80">{p.role}</p>}
                    </div>
                    {p.description && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground line-clamp-5">{p.description}</p>
                    )}
                    {p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills.map((s) => (
                          <span key={s} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    {imgs.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imgs.map((img, k) => (
                          <button
                            key={img.src + k}
                            type="button"
                            onClick={() => setLightbox({ images: imgs, index: k })}
                            title={img.alt}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-border cursor-zoom-in"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.src} alt={img.alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Bölüm: Bağlantı ──────────────────────────────────────────── */}
      <section className="pd-in space-y-3" style={{ animationDelay: "210ms" }}>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />{t("detail.connectionSection")}
        </h3>
        <Card className={`shadow-sm overflow-hidden ${ELEVATED}`}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              {saved ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>{tc("connected")}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">{tc("notConnected")}</span>
              )}
            </div>
            <input
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={PLATFORM_URL_PLACEHOLDERS[platform]}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {connError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />{connError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={saved && !isDirty ? "outline" : "default"}
                disabled={savingConn || !draft.trim()}
                onClick={saveConnection}
                className="gap-1.5 h-7 text-xs"
              >
                <Save className="h-3 w-3" />
                {savingConn ? tc("saving") : saved && !isDirty ? tc("saved") : tc("save")}
              </Button>
              {saved && (
                <>
                  <a href={saved} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" />{tc("view")}
                  </a>
                  <button
                    onClick={removeConnection}
                    disabled={deletingConn}
                    className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                    title={tc("removeConnection")}
                    aria-label={tc("removeConnection")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Bölüm: Eşleşen işler ─────────────────────────────────────── */}
      <section className="pd-in space-y-3" style={{ animationDelay: "270ms" }}>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />{t("detail.jobsSection")}
        </h3>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-10 text-center">
            <Briefcase className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t("detail.noJobs")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5 h-7 text-xs">
              <Link href="/dashboard/jobs">{t("detail.noJobsCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-3">
            <div className={`space-y-1.5 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedJobId(job.id === selectedJobId ? null : job.id);
                    }
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 ${
                    job.id === selectedJobId
                      ? "border-[#00F0FF]/40 bg-[#00F0FF]/5"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug truncate">{job.title}</p>
                      {job.company && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{job.company}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tj(`status.${job.status}`)}</p>
                    </div>
                    {job.match_score !== null && (
                      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums shrink-0 ${scoreColor(job.match_score)}`}>
                        {job.match_score}
                      </span>
                    )}
                  </div>
                  {job.match_score !== null && (
                    <div className="mt-2 ml-4 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarColor(job.match_score)}`} style={{ width: `${job.match_score}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedJob && (
              <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
                <JobDetailPanel
                  job={selectedJob}
                  onClose={() => setSelectedJobId(null)}
                  onJobUpdated={(updated) => setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j))}
                  onCreditsUpdate={(c) => applyCredits(c)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Bölüm: Teklif geçmişi + ipuçları ─────────────────────────── */}
      <section className="pd-in space-y-3" style={{ animationDelay: "330ms" }}>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />{t("detail.proposalsSection")}
        </h3>
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-10 text-center">
            <Clock className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t("detail.noProposals")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5 h-7 text-xs">
              <Link href="/dashboard/jobs">{t("detail.noJobsCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {jobTitleById.get(p.job_id) ?? t("detail.proposalJob")} · {new Date(p.created_at).toLocaleDateString(locale)}
                  </span>
                  <CopyButton text={p.content} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{p.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Platforma özel ipuçları */}
        <div className="rounded-2xl border border-violet-500/15 dark:border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-2 text-violet-500 dark:text-violet-300">
            <Lightbulb className="h-3.5 w-3.5" />{t("detail.tipsTitle")}
          </p>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Foto lightbox (avatar + portfolyo görselleri; ileri/geri gezinme). */}
      {lightbox && (
        <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
