"use client";

// Faz 1 MVP UI'ı: tek profili düzenle/kaydet, sonra her platform için uyarla.
// Her uyarlamanın gerçek maliyeti gösterilir ve kümülatif harcama güncellenir.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";

interface InitialProfile {
  headline: string;
  summary: string;
  skills: string[];
}

interface AdaptOutput {
  headline: string;
  body: string;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

export function ProfileStudio({
  initialProfile,
  initialSpendUsd,
}: {
  initialProfile: InitialProfile | null;
  initialSpendUsd: number;
}) {
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [summary, setSummary] = useState(initialProfile?.summary ?? "");
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const [spend, setSpend] = useState(initialSpendUsd);
  const [results, setResults] = useState<Partial<Record<PlatformId, AdaptOutput>>>({});
  const [adapting, setAdapting] = useState<PlatformId | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Profil Stüdyosu</h1>
        <Badge variant="secondary" title="Bu hesabın toplam harcaması">
          Harcama: {formatUsd(spend)}
        </Badge>
      </div>

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
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="ör. Senior Frontend Developer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Özet</Label>
            <Textarea
              id="summary"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Deneyimini, uzmanlığını ve öne çıkan sonuçlarını kısaca anlat."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Beceriler (virgülle ayır)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
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
                  Profili kaydedip “Uyarla”ya bas; {PLATFORMS[id].label} için optimize metin burada görünecek.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
