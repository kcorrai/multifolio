"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/ai/platforms";
import type { JobFeedRow } from "@/lib/validation/schemas/feed";
import { ChipsInput } from "./chips-input";

// Sayısal opsiyonel alan: boş string → undefined, aksi halde Number.
function numOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

// Aramadan "feed olarak kaydet" için ön-doldurma değerleri.
export interface FeedPrefill {
  name?: string;
  platform?: string;
  keywords?: string[];
  excludeKeywords?: string[];
  excludeCountries?: string[];
  minHourlyRate?: number;
  minFixedPrice?: number;
  minClientSpent?: number;
}

export function FeedModal({
  onClose, onSaved, feed, initial,
}: {
  onClose: () => void;
  onSaved: () => void;
  /** Verilirse düzenleme modu: PATCH /api/feeds/[id]. */
  feed?: JobFeedRow | null;
  /** Yeni feed için ön-doldurma (ör. aramadaki filtrelerden). */
  initial?: FeedPrefill;
}) {
  const t = useTranslations("feed");
  const [name, setName] = useState(feed?.name ?? initial?.name ?? "");
  const [platform, setPlatform] = useState(feed?.platform ?? initial?.platform ?? "");
  const [keywords, setKeywords] = useState<string[]>(feed?.keywords ?? initial?.keywords ?? []);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(feed?.exclude_keywords ?? initial?.excludeKeywords ?? []);
  const [excludeCountries, setExcludeCountries] = useState<string[]>(feed?.exclude_countries ?? initial?.excludeCountries ?? []);
  const [minHourly, setMinHourly] = useState(feed?.min_hourly_rate?.toString() ?? initial?.minHourlyRate?.toString() ?? "");
  const [minFixed, setMinFixed] = useState(feed?.min_fixed_price?.toString() ?? initial?.minFixedPrice?.toString() ?? "");
  const [minClientSpent, setMinClientSpent] = useState(feed?.min_client_spent?.toString() ?? initial?.minClientSpent?.toString() ?? "");
  const [minScore, setMinScore] = useState(feed?.min_score ?? 0);
  const [notify, setNotify] = useState(feed?.notify ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setError("");
    // Düzenlemede boş bırakılan alan null gider (temizle); oluşturmada undefined (yok say).
    const body = feed
      ? {
          name: name.trim(),
          keywords,
          excludeKeywords,
          platform: platform || null,
          excludeCountries,
          minHourlyRate: numOrUndef(minHourly) ?? null,
          minFixedPrice: numOrUndef(minFixed) ?? null,
          minClientSpent: numOrUndef(minClientSpent) ?? null,
          minScore: minScore > 0 ? minScore : null,
          notify,
        }
      : {
          name: name.trim(),
          keywords,
          excludeKeywords,
          platform: platform || undefined,
          excludeCountries,
          minHourlyRate: numOrUndef(minHourly),
          minFixedPrice: numOrUndef(minFixed),
          minClientSpent: numOrUndef(minClientSpent),
          minScore: minScore > 0 ? minScore : undefined,
          notify,
        };
    const res = await fetch(feed ? `/api/feeds/${feed.id}` : "/api/feeds", {
      method: feed ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? t("actionFailed")); setSaving(false); return; }
    setSaving(false); onSaved(); onClose();
  }

  const numericInput = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{feed ? t("modal.editTitle") : t("modal.title")}</h3>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground/50 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3.5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.nameLabel")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("modal.namePlaceholder")} className={numericInput} />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.platformLabel")}</span>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
              >
                <option value="">{t("modal.allPlatforms")}</option>
                {Object.values(PLATFORMS).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.keywordsLabel")}</span>
            <ChipsInput values={keywords} onChange={setKeywords} placeholder={t("modal.addKeyword")} removeTitle={t("modal.removeKeyword")} max={10} />
            <p className="text-[11px] text-muted-foreground/70">{t("modal.keywordsHint")}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.excludeKeywordsLabel")}</span>
            <ChipsInput values={excludeKeywords} onChange={setExcludeKeywords} placeholder={t("modal.addExcludeKeyword")} removeTitle={t("modal.removeKeyword")} max={20} />
            <p className="text-[11px] text-muted-foreground/70">{t("modal.excludeKeywordsHint")}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.excludeCountriesLabel")}</span>
            <ChipsInput values={excludeCountries} onChange={setExcludeCountries} placeholder={t("modal.addCountry")} removeTitle={t("modal.removeKeyword")} max={20} />
            <p className="text-[11px] text-muted-foreground/70">{t("modal.excludeCountriesHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.minHourlyLabel")}</span>
              <input value={minHourly} onChange={(e) => setMinHourly(e.target.value)} inputMode="numeric" placeholder="25" className={numericInput} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.minFixedLabel")}</span>
              <input value={minFixed} onChange={(e) => setMinFixed(e.target.value)} inputMode="numeric" placeholder="500" className={numericInput} />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minClientSpentLabel")}</span>
            <input value={minClientSpent} onChange={(e) => setMinClientSpent(e.target.value)} inputMode="numeric" placeholder="1000" className={numericInput} />
            <p className="text-[11px] text-muted-foreground/70">{t("modal.minClientSpentHint")}</p>
          </label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.minScoreLabel")}</span>
              <span className="text-xs font-bold text-[#00F0FF]">{minScore > 0 ? minScore : t("modal.minScoreOff")}</span>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground/70">{t("modal.minScoreHint")}</p>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#00F0FF] cursor-pointer"
            />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Bell className="h-3.5 w-3.5 text-[#00F0FF]" />{t("modal.notifyLabel")}
              </span>
              <span className="block text-[11px] text-muted-foreground/70 mt-0.5">{t("modal.notifyHint")}</span>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>{t("modal.cancel")}</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{t("modal.save")}</Button>
        </div>
      </div>
    </div>
  );
}
