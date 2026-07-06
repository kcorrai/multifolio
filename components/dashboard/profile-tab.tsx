"use client";

import { useMemo, useState } from "react";
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
import { CreditCost } from "@/components/credit-cost";
import { PLATFORMS } from "@/lib/ai/platforms";
import { ChipsInput } from "./chips-input";
import { ELEVATED, type InitialProfile, type ConnectedProfile } from "./shared";

interface Suggestion { headline: string; summary: string; skills: string[] }
type Field = "headline" | "summary" | "skills";

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
  const portfolio = initialProfile?.portfolio ?? [];

  // Seçilebilir profil fotoğrafları: çekirdek avatar + bağlı her platformun avatarı
  // (URL bazında tekilleştirilir). Kullanıcı hangisini kullanacağını seçer; Kaydet'te
  // avatar_url olarak persist edilir → istediği kaynağın fotosunu kullanabilir.
  const availableAvatars = useMemo(() => {
    const list: { url: string; label: string }[] = [];
    const seen = new Set<string>();
    const push = (url: string | null, label: string) => {
      if (url && !seen.has(url)) { seen.add(url); list.push({ url, label }); }
    };
    push(initialProfile?.avatarUrl ?? null, t("avatarCurrent"));
    connectedProfiles.forEach((c) => push(c.avatarUrl, PLATFORMS[c.platform].label));
    return list;
  }, [initialProfile?.avatarUrl, connectedProfiles, t]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    initialProfile?.avatarUrl ?? availableAvatars[0]?.url ?? null,
  );
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

  async function saveProfile() {
    setSaveState("saving"); setProfileError("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      // Seçilen avatar da persist edilir (foto seçimi Kaydet'te kalıcı olur).
      body: JSON.stringify({ headline, summary, skills, avatar_url: selectedAvatar }),
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
    router.refresh(); // kredi düştü → shell'deki bakiye rozetini tazele
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
          <div className="flex flex-col items-center gap-2 shrink-0">
            {selectedAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedAvatar} alt={t("photoAlt")}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-[#00F0FF]/30" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#00F0FF]/15 to-violet-500/15 border border-[#00F0FF]/20 flex items-center justify-center">
                <User className="h-9 w-9 text-[#00F0FF]/70" />
              </div>
            )}
            {/* Birden çok kaynaktan foto varsa hangisini kullanacağını seçtir (Kaydet'te persist). */}
            {availableAvatars.length > 1 && (
              <div className="flex items-center gap-1.5" role="group" aria-label={t("avatarPick")}>
                {availableAvatars.map((a) => (
                  <button
                    key={a.url}
                    type="button"
                    onClick={() => { setSelectedAvatar(a.url); setSaveState("idle"); }}
                    title={a.label}
                    aria-label={a.label}
                    aria-pressed={selectedAvatar === a.url}
                    className={`h-7 w-7 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                      selectedAvatar === a.url ? "border-[#00F0FF]" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

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
              {/* AI önerisi uygulanıp henüz kaydedilmediyse: sessiz kayıp riskini uyar. */}
              {(applied.headline || applied.summary || applied.skills) && saveState !== "saved" && saveState !== "saving" && (
                <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" /> {t("unsavedReminder")}
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
                <span className="shrink-0 text-[#00F0FF]">
                  <CreditCost kind="profile_suggest" />
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
        </div>
      </div>
    </div>
  );
}
