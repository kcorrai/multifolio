"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipsInput } from "./chips-input";
import { ELEVATED, type InitialProfile } from "./shared";

export function ProfileTab({ initialProfile }: { initialProfile: InitialProfile | null }) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  // Görseller içe aktarmadan gelir; burada salt-okunur gösterilir (kaydetme ezmez).
  const avatarUrl = initialProfile?.avatarUrl ?? null;
  const portfolio = initialProfile?.portfolio ?? [];
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialProfile !== null ? "saved" : "idle",
  );
  const [profileError, setProfileError] = useState("");

  const profileSaved = saveState === "saved";

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
    // İlk profil kaydında referral bonusu verilmiş olabilir → sunucu-taraflı
    // kredi bakiyesi (layout) tazelensin.
    if (body?.referralBonus === true) router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
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

      <div className="lg:col-span-2 space-y-4">
        <Card className={`shadow-sm overflow-hidden ${ELEVATED}`}>
          <div className="h-1.5 bg-gradient-to-r from-[#00F0FF] via-violet-500 to-[#00F0FF]/40" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{t("preview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avatarUrl && (
              // Bionluk dış görseli — next/image remotePatterns'a gerek kalmasın.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={t("photoAlt")}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#00F0FF]/30"
              />
            )}
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
              {skills.length > 0 ? (
                skills.slice(0, 8).map((s) => (
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
                    <img
                      key={i}
                      src={item.imageUrl}
                      alt={item.title}
                      title={item.title}
                      className="aspect-square w-full rounded-lg object-cover border border-border"
                    />
                  ) : null,
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
  );
}
