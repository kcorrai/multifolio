"use client";

// Seçili feed'in UpHunt tarzı SAYFA İÇİ ayar panelleri (modal değil):
// Ön filtre (ad/platform/keyword/ülke/ücret/harcama) + AI skorlama (min skor)
// + e-posta bildirimi. Değişiklik olunca Kaydet/Vazgeç çubuğu belirir; PATCH
// /api/feeds/[id] ile kaydedilir. feed prop'u değişince parent key={feed.id}
// ile remount eder (state tazelenir).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Bell, SlidersHorizontal, Sparkles, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/ai/platforms";
import type { JobFeedRow } from "@/lib/validation/schemas/feed";
import { ChipsInput } from "./chips-input";

// Sayısal opsiyonel alan: boş/geçersiz → null.
function numOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function FeedSettingsPanel({
  feed, onSaved,
}: {
  feed: JobFeedRow;
  onSaved: (feed: JobFeedRow) => void;
}) {
  const t = useTranslations("feed");
  const [name, setName] = useState(feed.name);
  const [platform, setPlatform] = useState(feed.platform ?? "");
  const [keywords, setKeywords] = useState<string[]>(feed.keywords);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(feed.exclude_keywords);
  const [excludeCountries, setExcludeCountries] = useState<string[]>(feed.exclude_countries);
  const [minHourly, setMinHourly] = useState(feed.min_hourly_rate?.toString() ?? "");
  const [minFixed, setMinFixed] = useState(feed.min_fixed_price?.toString() ?? "");
  const [minClientSpent, setMinClientSpent] = useState(feed.min_client_spent?.toString() ?? "");
  const [minScore, setMinScore] = useState(feed.min_score ?? 0);
  const [notify, setNotify] = useState(feed.notify);
  const [proposalPrompt, setProposalPrompt] = useState(feed.proposal_prompt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    name.trim() !== feed.name ||
    (platform || null) !== feed.platform ||
    JSON.stringify(keywords) !== JSON.stringify(feed.keywords) ||
    JSON.stringify(excludeKeywords) !== JSON.stringify(feed.exclude_keywords) ||
    JSON.stringify(excludeCountries) !== JSON.stringify(feed.exclude_countries) ||
    numOrNull(minHourly) !== feed.min_hourly_rate ||
    numOrNull(minFixed) !== feed.min_fixed_price ||
    numOrNull(minClientSpent) !== feed.min_client_spent ||
    (minScore > 0 ? minScore : null) !== feed.min_score ||
    notify !== feed.notify ||
    (proposalPrompt.trim() || null) !== feed.proposal_prompt;

  function discard() {
    setName(feed.name);
    setPlatform(feed.platform ?? "");
    setKeywords(feed.keywords);
    setExcludeKeywords(feed.exclude_keywords);
    setExcludeCountries(feed.exclude_countries);
    setMinHourly(feed.min_hourly_rate?.toString() ?? "");
    setMinFixed(feed.min_fixed_price?.toString() ?? "");
    setMinClientSpent(feed.min_client_spent?.toString() ?? "");
    setMinScore(feed.min_score ?? 0);
    setNotify(feed.notify);
    setProposalPrompt(feed.proposal_prompt ?? "");
    setError("");
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const body = {
      name: name.trim(),
      keywords,
      excludeKeywords,
      platform: platform || null,
      excludeCountries,
      minHourlyRate: numOrNull(minHourly),
      minFixedPrice: numOrNull(minFixed),
      minClientSpent: numOrNull(minClientSpent),
      minScore: minScore > 0 ? minScore : null,
      notify,
      proposalPrompt: proposalPrompt.trim() ? proposalPrompt.trim() : null,
    };
    const res = await fetch(`/api/feeds/${feed.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? "Error"); setSaving(false); return; }
    setSaving(false); setSaved(true);
    onSaved(data.feed as JobFeedRow);
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-3">
      {/* ── Ön filtre ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#00F0FF]" />{t("settingsPrefilter")}
          </h4>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer"
            >
              <option value="">{t("modal.allPlatforms")}</option>
              {Object.values(PLATFORMS).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t("modal.nameLabel")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minClientSpentLabel")}</span>
            <input value={minClientSpent} onChange={(e) => setMinClientSpent(e.target.value)} inputMode="numeric" placeholder="1000" className={input} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minHourlyLabel")}</span>
            <input value={minHourly} onChange={(e) => setMinHourly(e.target.value)} inputMode="numeric" placeholder="25" className={input} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minFixedLabel")}</span>
            <input value={minFixed} onChange={(e) => setMinFixed(e.target.value)} inputMode="numeric" placeholder="500" className={input} />
          </label>
        </div>
      </div>

      {/* ── AI skorlama + bildirim ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F0FF]" />{t("settingsScoring")}
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <Bell className={`h-3.5 w-3.5 ${notify ? "text-[#00F0FF]" : "text-muted-foreground/50"}`} />
            <span className="text-xs font-medium">{t("modal.notifyLabel")}</span>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-4 w-4 accent-[#00F0FF] cursor-pointer"
            />
          </label>
        </div>

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
        <p className="text-[11px] text-muted-foreground/70">{t("modal.notifyHint")}</p>
      </div>

      {/* ── Teklif yönergesi (feed'e özel AI prompt'u) ───────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#00F0FF]" />{t("settingsProposalPrompt")}
        </h4>
        <textarea
          value={proposalPrompt}
          onChange={(e) => setProposalPrompt(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder={t("settingsProposalPromptPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40"
        />
        <p className="text-[11px] text-muted-foreground/70">{t("settingsProposalPromptHint")}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {(dirty || saved) && (
        <div className="flex items-center justify-end gap-2">
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />{t("settingsSaved")}
            </span>
          )}
          {dirty && (
            <>
              <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>{t("settingsDiscard")}</Button>
              <Button size="sm" onClick={save} disabled={saving || !name.trim()}>
                {saving ? t("modal.save") + "…" : t("settingsSave")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
