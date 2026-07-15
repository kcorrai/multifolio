"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Sparkles, Briefcase, ChevronRight, AlertCircle, Wand2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS, type PlatformId } from "@/lib/ai/platforms";
import { CREDIT_COSTS } from "@/lib/credits/costs";
import { ELEVATED, PLATFORM_STYLES } from "./shared";
import { useDashboard } from "./dashboard-context";

export function PlatformsHubTab({
  profileSaved, connections, jobsByPlatform, initialAdaptedPlatforms,
}: {
  profileSaved: boolean;
  connections: Record<string, string>;
  jobsByPlatform: Record<string, number>;
  initialAdaptedPlatforms: PlatformId[];
}) {
  const t = useTranslations("platforms");
  const { platforms, adaptResults, setAdaptResult, applyCredits, triggerComingSoon } = useDashboard();
  // Kullanıcı hangi platformlara uyarlanacağını SEÇER (platform sayısı 8'e çıktı →
  // "hepsi" 16 kredi; seçim kredi sürprizini önler). Varsayılan: tümü seçili.
  const [selected, setSelected] = useState<Set<PlatformId>>(() => new Set(platforms));
  // Seçili platformları uyarlamanın toplam kredi maliyeti.
  const adaptAllCost = selected.size * CREDIT_COSTS.adaptation;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{ count: number; stopped: boolean } | null>(null);

  function toggle(id: PlatformId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Tek-tık: çekirdek profili SEÇİLİ platformlara uyarla (aktivasyon; /api/adapt/all).
  async function adaptAll() {
    if (selected.size === 0) return;
    setBusy(true); setError(""); setSummary(null);
    const res = await fetch("/api/adapt/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms: [...selected] }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("adaptAll.error"));
      if (res.status === 402) triggerComingSoon();
      setBusy(false); return;
    }
    for (const r of body.results as { platform: PlatformId; output: { headline: string; body: string } }[]) {
      setAdaptResult(r.platform, r.output);
    }
    if (body.credits) applyCredits(body.credits);
    setSummary({ count: body.adaptedCount, stopped: body.stoppedForCredits });
    setBusy(false);
  }

  const adaptedCount = platforms.filter((id) => !!adaptResults[id] || initialAdaptedPlatforms.includes(id)).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
        <h2 className="text-2xl font-bold tracking-tight mt-1">{t("hubTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("hubSubtitle")}</p>
      </div>

      {!profileSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{t("card.saveProfileFirst")}
        </div>
      )}

      {/* ── Tek-tık: tüm platformlara uyarla (aktivasyon) ─────────────── */}
      {profileSaved && (
        <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-[#00F0FF]/[0.06] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">{t("adaptAll.title")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("adaptAll.desc")}</p>
              </div>
            </div>
            <Button onClick={adaptAll} disabled={busy || selected.size === 0} className="gap-2 shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? t("adaptAll.busy") : t("adaptAll.button")}
              <span className="rounded-full bg-black/10 dark:bg-white/15 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">{adaptAllCost}</span>
            </Button>
          </div>

          {/* Platform seçimi: kredi kontrolü (kullanıcı istemediği platforma harcamaz). */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("adaptAll.selectHint", { count: selected.size })}</p>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((id) => {
                const on = selected.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "border-[#00F0FF]/40 bg-[#00F0FF]/10 text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <PlatformLogo platform={id} size={14} />
                    {PLATFORMS[id].label}
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>
          )}
          {summary && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {summary.stopped ? t("adaptAll.partial", { count: summary.count }) : t("adaptAll.done", { count: summary.count })}
            </p>
          )}
          {!summary && adaptedCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">{t("adaptAll.already", { count: adaptedCount, total: platforms.length })}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {platforms.map((id) => {
          const style = PLATFORM_STYLES[id];
          const connected = !!connections[id];
          // Oturum içi taze üretim VEYA DB'deki kalıcı kayıt.
          const adapted = !!adaptResults[id] || initialAdaptedPlatforms.includes(id);
          const jobCount = jobsByPlatform[id] ?? 0;
          return (
            <Link key={id} href={`/dashboard/platforms/${id}`} className="group block">
              <Card className={`h-full shadow-sm overflow-hidden ${ELEVATED} hover:-translate-y-0.5 ${style.accent}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${style.icon}`}>
                      <PlatformLogo platform={id} size={20} />
                    </div>
                    <p className="text-sm font-semibold flex-1">{PLATFORMS[id].label}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {connected ? (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                        <CheckCircle2 className="h-3 w-3" />{t("card.connected")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-muted-foreground/60 px-1.5 py-0.5">
                        {t("card.notConnected")}
                      </span>
                    )}
                    {adapted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF]">
                        <Sparkles className="h-3 w-3" />{t("card.adapted")}
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3 shrink-0" />{t("card.jobsCount", { count: jobCount })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
