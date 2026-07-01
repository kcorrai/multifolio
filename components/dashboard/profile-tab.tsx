"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ELEVATED, type InitialProfile } from "./shared";

export function ProfileTab({ initialProfile }: { initialProfile: InitialProfile | null }) {
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialProfile !== null ? "saved" : "idle",
  );
  const [profileError, setProfileError] = useState("");

  const profileSaved = saveState === "saved";

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

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className={`shadow-sm lg:col-span-3 ${ELEVATED}`}>
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
        <Card className={`shadow-sm overflow-hidden ${ELEVATED}`}>
          <div className="h-1.5 bg-gradient-to-r from-[#00F0FF] via-violet-500 to-[#00F0FF]/40" />
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

        <Card className={`shadow-sm ${ELEVATED}`}>
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
  );
}
