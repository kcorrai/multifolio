"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Save, CheckCircle2, AlertCircle, Check, User, Wand2, Sparkles,
  ExternalLink, ArrowUpRight, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS } from "@/lib/ai/platforms";
import { ChipsInput } from "./chips-input";
import { isHeadlineComplete, isSummaryComplete, areSkillsComplete } from "@/lib/profile-strength";
import { ELEVATED, type InitialProfile, type ConnectedProfile } from "./shared";

interface Suggestion { headline: string; summary: string; skills: string[] }
type Field = "headline" | "summary" | "skills";

// Hero'daki dairesel tamamlanma göstergesi (SVG halka).
function CompletionRing({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="url(#pgrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} className="transition-[stroke-dashoffset] duration-700"
        />
        <defs>
          <linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums">
        {percent}%
      </span>
    </div>
  );
}

export function ProfileTab({
  initialProfile, connectedProfiles = [],
}: {
  initialProfile: InitialProfile | null;
  connectedProfiles?: ConnectedProfile[];
}) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  // Görseller içe aktarmadan gelir; burada salt-okunur gösterilir (kaydetme ezmez).
  // Çekirdek profilde foto yoksa bağlı public profillerden (en son çekilen) foto'ya düş.
  const avatarUrl = initialProfile?.avatarUrl ?? connectedProfiles.find((c) => c.avatarUrl)?.avatarUrl ?? null;
  const portfolio = initialProfile?.portfolio ?? [];
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialProfile !== null ? "saved" : "idle",
  );
  const [profileError, setProfileError] = useState("");

  // ── AI önerisi (public profillerden) ──────────────────────────────────
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestError, setSuggestError] = useState("");
  const [applied, setApplied] = useState<Record<Field, boolean>>({ headline: false, summary: false, skills: false });

  const profileSaved = saveState === "saved";
  const hasConnected = connectedProfiles.length > 0;

  // Tamamlanma yüzdesi (hero halkası): 4 eşit ağırlıklı adım. Alan eşikleri
  // Overview "Kurulum ilerlemesi" ile AYNI predicate'lerden (lib/profile-strength)
  // → iki gösterge çelişmez.
  const steps = [
    isHeadlineComplete(headline),
    isSummaryComplete(summary),
    areSkillsComplete(skills),
    profileSaved,
  ];
  const percent = Math.round((steps.filter(Boolean).length / steps.length) * 100);

  async function saveProfile() {
    setSaveState("saving"); setProfileError("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, summary, skills }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setSaveState("error"); setProfileError(body?.error?.message ?? t("saveError"));
      return;
    }
    setSaveState("saved");
    if (body?.referralBonus === true) router.refresh();
  }

  async function generateSuggestion() {
    setSuggesting(true); setSuggestError(""); setSuggestion(null);
    setApplied({ headline: false, summary: false, skills: false });
    const res = await fetch("/api/profile/suggest", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setSuggestError(body?.error?.message ?? t("aiNeedsData"));
      setSuggesting(false); return;
    }
    setSuggestion(body.suggestion as Suggestion);
    setSuggesting(false);
  }

  function applyField(field: Field) {
    if (!suggestion) return;
    if (field === "headline") setHeadline(suggestion.headline);
    if (field === "summary") setSummary(suggestion.summary);
    if (field === "skills") setSkills(suggestion.skills);
    setApplied((p) => ({ ...p, [field]: true }));
    setSaveState("idle");
  }

  function applyAll() {
    if (!suggestion) return;
    setHeadline(suggestion.headline);
    setSummary(suggestion.summary);
    setSkills(suggestion.skills);
    setApplied({ headline: true, summary: true, skills: true });
    setSaveState("idle");
  }

  return (
    <div className="space-y-6">

      {/* ── Kimlik hero'su ─────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-card ${ELEVATED}`}>
        <div className="h-1 bg-gradient-to-r from-[#00F0FF] via-violet-500 to-[#00F0FF]/30" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={t("photoAlt")}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-[#00F0FF]/30" />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#00F0FF]/15 to-violet-500/15 border border-[#00F0FF]/20 flex items-center justify-center">
              <User className="h-9 w-9 text-[#00F0FF]/70" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">
              {t("identityEyebrow")}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight truncate">
              {headline || <span className="text-muted-foreground font-medium">{t("identityUntitled")}</span>}
            </h2>
            {summary && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{summary}</p>
            )}
            {hasConnected && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {connectedProfiles.map((c) => (
                    <span key={c.platform}
                      className="h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center"
                      title={PLATFORMS[c.platform].label}>
                      <PlatformLogo platform={c.platform} size={13} />
                    </span>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("connectedCount", { count: connectedProfiles.length })}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0">
            <CompletionRing percent={percent} />
            <span className="text-[11px] text-muted-foreground">{t("completion")}</span>
          </div>
        </div>
      </div>

      {/* ── Gövde: form + zeka rayı ────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Sol: çekirdek profil formu */}
        <Card className={`shadow-sm lg:col-span-3 ${ELEVATED}`}>
          <CardHeader>
            <CardTitle className="text-base">{t("coreProfileTitle")}</CardTitle>
            <CardDescription>{t("coreProfileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="headline">{t("headlineLabel")}</Label>
              <Input id="headline" value={headline}
                onChange={(e) => { setHeadline(e.target.value); setSaveState("idle"); }}
                placeholder={t("headlinePlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">{t("summaryLabel")}</Label>
              <Textarea id="summary" rows={5} value={summary}
                onChange={(e) => { setSummary(e.target.value); setSaveState("idle"); }}
                placeholder={t("summaryPlaceholder")}
                className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skills">{t("skillsLabel")}</Label>
              <ChipsInput
                id="skills"
                values={skills}
                onChange={(next) => { setSkills(next); setSaveState("idle"); }}
                placeholder={t("addSkill")}
                removeTitle={t("removeSkill")}
                max={30}
              />
              <p className="text-xs text-muted-foreground">{t("skillsHint")}</p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{profileError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={saveProfile} disabled={saveState === "saving"} className="gap-2">
                <Save className="h-4 w-4" />
                {saveState === "saving" ? t("saving") : t("save")}
              </Button>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {t("saved")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sağ: AI önerisi + bağlı profiller + tamamlanma */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI önerisi (public profillerden) */}
          <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Wand2 className="h-4 w-4 text-[#00F0FF]" />{t("aiTitle")}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{t("aiDesc")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {t("free")}
                </span>
              </div>

              {!hasConnected ? (
                <div className="rounded-xl border border-dashed border-border p-3 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">{t("aiNeedsData")}</p>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href="/dashboard/platforms"><Layers className="h-3.5 w-3.5" />{t("aiConnectCta")}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={generateSuggestion} disabled={suggesting} className="w-full gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {suggesting ? t("aiGenerating") : suggestion ? t("aiRegenerate") : t("aiGenerate")}
                  </Button>
                  {suggestError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />{suggestError}
                    </p>
                  )}
                </>
              )}

              {suggestion && (
                <div className="space-y-2.5 pt-1">
                  {([
                    { field: "headline" as Field, label: t("headlineLabel"), value: suggestion.headline },
                    { field: "summary" as Field, label: t("summaryLabel"), value: suggestion.summary },
                    { field: "skills" as Field, label: t("skillsLabel"), value: suggestion.skills.join(" · ") },
                  ]).map(({ field, label, value }) => (
                    <div key={field} className="rounded-xl border border-border bg-background p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                        <button
                          onClick={() => applyField(field)}
                          className={`shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                            applied[field]
                              ? "text-green-600 dark:text-green-400"
                              : "text-[#00F0FF] hover:bg-[#00F0FF]/10"
                          }`}
                        >
                          {applied[field] ? <><Check className="h-3 w-3" />{t("aiApplied")}</> : <><ArrowUpRight className="h-3 w-3" />{t("aiApply")}</>}
                        </button>
                      </div>
                      <p className={`text-xs text-foreground leading-relaxed ${field === "summary" ? "line-clamp-3" : "line-clamp-2"}`}>{value}</p>
                    </div>
                  ))}
                  <Button onClick={applyAll} variant="outline" size="sm" className="w-full gap-1.5">
                    <Check className="h-3.5 w-3.5" />{t("aiApplyAll")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bağlı public profiller */}
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("connectedTitle")}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{t("connectedDesc")}</p>
              </div>
              {hasConnected ? (
                <div className="space-y-2">
                  {connectedProfiles.map((c) => (
                    <div key={c.platform} className="flex items-start gap-2.5 rounded-xl border border-border p-2.5">
                      <span className="h-8 w-8 shrink-0 rounded-lg bg-muted/60 flex items-center justify-center">
                        <PlatformLogo platform={c.platform} size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate">{PLATFORMS[c.platform].label}</p>
                          {c.sourceUrl && (
                            <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
                              title={t("viewSource")} aria-label={t("viewSource")}
                              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {c.headline && <p className="text-[11px] text-muted-foreground truncate">{c.headline}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {[
                            c.skills.length > 0 ? t("connectedSkills", { count: c.skills.length }) : null,
                            t("connectedUpdated", { date: new Date(c.fetchedAt).toLocaleDateString(locale) }),
                          ].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">{t("connectedEmpty")}</p>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href="/dashboard/platforms"><Layers className="h-3.5 w-3.5" />{t("aiConnectCta")}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolyo görselleri (içe aktarmadan) */}
          {portfolio.length > 0 && (
            <Card className={`shadow-sm ${ELEVATED}`}>
              <CardContent className="pt-4 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("portfolioTitle", { count: portfolio.length })}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {portfolio.slice(0, 9).map((item, i) =>
                    item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={item.imageUrl} alt={item.title} title={item.title}
                        className="aspect-square w-full rounded-lg object-cover border border-border" />
                    ) : null,
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tamamlanma */}
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("completion")}</p>
              <div className="space-y-2">
                {[
                  { label: t("headlineLabel"), done: headline.trim().length > 0 },
                  { label: t("summaryLabel"),  done: summary.trim().length > 0 },
                  { label: t("skillsLabel"),   done: skills.length > 0 },
                  { label: t("saved"),         done: profileSaved },
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
    </div>
  );
}
