"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/ai/platforms";
import { ChipsInput } from "./chips-input";

// Sayısal opsiyonel alan: boş string → undefined, aksi halde Number.
function numOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function FeedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("feed");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludeCountries, setExcludeCountries] = useState<string[]>([]);
  const [minHourly, setMinHourly] = useState("");
  const [minFixed, setMinFixed] = useState("");
  const [minClientSpent, setMinClientSpent] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setError("");
    const body = {
      name: name.trim(),
      keywords,
      platform: platform || undefined,
      excludeCountries,
      minHourlyRate: numOrUndef(minHourly),
      minFixedPrice: numOrUndef(minFixed),
      minClientSpent: numOrUndef(minClientSpent),
      minScore: minScore > 0 ? minScore : undefined,
    };
    const res = await fetch("/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? "Error"); setSaving(false); return; }
    setSaving(false); onSaved(); onClose();
  }

  const numericInput = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t("modal.title")}</h3>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground"><X className="h-4 w-4" /></button>
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
