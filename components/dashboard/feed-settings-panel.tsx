"use client";

// Seçili feed'in UpHunt tarzı SAYFA İÇİ ayar panelleri (modal değil):
// Ön filtre (ad/platform/keyword/ülke/ücret/harcama) + AI skorlama (min skor)
// + e-posta bildirimi. Değişiklik olunca Kaydet/Vazgeç çubuğu belirir; PATCH
// /api/feeds/[id] ile kaydedilir. feed prop'u değişince parent key={feed.id}
// ile remount eder (state tazelenir).
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Bell, SlidersHorizontal, Sparkles, Check, FileText, Gauge, Plus, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/ai/platforms";
import type { JobFeedRow, PoolJob } from "@/lib/validation/schemas/feed";
import { feedStrength } from "@/lib/feed/strength";
import { ChipsInput } from "./chips-input";

// Sayısal opsiyonel alan: boş/geçersiz → null.
function numOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function FeedSettingsPanel({
  feed, jobs, onSaved,
}: {
  feed: JobFeedRow;
  jobs: PoolJob[];
  onSaved: (feed: JobFeedRow) => void;
}) {
  const t = useTranslations("feed");
  // Feed'in özel prompt'u yoksa önerilen (kriter bazlı) varsayılanı göster — düzenlenebilir.
  const defaultPrompt = t("proposalPromptDefault");
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
  const [proposalPrompt, setProposalPrompt] = useState(feed.proposal_prompt ?? defaultPrompt);
  // Arka-plan otomatik taslak: 0=kapalı, 1-10=açık (günlük tavan). Kredi harcar.
  const [autoDraftDaily, setAutoDraftDaily] = useState(feed.auto_draft_daily ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Feed gücü: seçili feed'in gösterdiği ilanların (jobs) profile uyumu + keyword önerisi.
  // Saf hesap, kredisiz; keyword state'i değişince canlı güncellenir.
  const strength = useMemo(() => feedStrength(jobs, keywords), [jobs, keywords]);
  function addKeyword(s: string) {
    setKeywords((k) => (k.length >= 10 || k.some((x) => x.toLowerCase() === s.toLowerCase()) ? k : [...k, s]));
  }

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
    // Önden dolu varsayılan "değişiklik" sayılmasın: taban = mevcut prompt ya da varsayılan.
    proposalPrompt.trim() !== (feed.proposal_prompt ?? defaultPrompt).trim() ||
    autoDraftDaily !== (feed.auto_draft_daily ?? 0);

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
    setProposalPrompt(feed.proposal_prompt ?? defaultPrompt);
    setAutoDraftDaily(feed.auto_draft_daily ?? 0);
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
      autoDraftDaily,
    };
    const res = await fetch(`/api/feeds/${feed.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? t("actionFailed")); setSaving(false); return; }
    setSaving(false); setSaved(true);
    onSaved(data.feed as JobFeedRow);
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-3">
      {/* ── Feed gücü (kredisiz metrik + keyword önerisi) ────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#00F0FF]" />{t("strength.title")}
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums">{strength.matchedCount}</p>
            <p className="text-[11px] text-muted-foreground">{t("strength.matched")}</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{strength.precisionPct === null ? "—" : `${strength.precisionPct}%`}</p>
            <p className="text-[11px] text-muted-foreground">{t("strength.precision")}</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{strength.avgRelevance ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{t("strength.avgRelevance")}</p>
          </div>
        </div>
        {strength.precisionPct === null && (
          <p className="text-[11px] text-muted-foreground/70">{t("strength.noSignal")}</p>
        )}
        {strength.suggestAdd.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground">{t("strength.suggestAdd")}</p>
            <div className="flex flex-wrap gap-1.5">
              {strength.suggestAdd.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addKeyword(s)}
                  disabled={keywords.length >= 10}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-medium hover:border-[#00F0FF] hover:text-[#00F0FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="h-3 w-3" />{s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Ön filtre + AI skorlama yan yana (UpHunt üst sıra) ─────────── */}
      <div className="grid gap-3 xl:grid-cols-2">
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
            <span className="block text-[11px] text-muted-foreground/70">{t("modal.minClientSpentHint")}</span>
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

      </div>

      {/* ── Teklif yönergesi (feed'e özel AI prompt'u) ───────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00F0FF]" />{t("settingsProposalPrompt")}
          </h4>
          {proposalPrompt.trim() !== defaultPrompt.trim() && (
            <button
              type="button"
              onClick={() => setProposalPrompt(defaultPrompt)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("settingsProposalPromptReset")}
            </button>
          )}
        </div>
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

      {/* ── Asistanlı başvuru + opt-in arka-plan otomatik taslak (auto-submit YOK) ─────── */}
      <div className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] p-4 space-y-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#00F0FF]" />{t("assistedApply.title")}
        </h4>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("assistedApply.desc")}</p>

        {/* Arka-plan otomatik taslak: opt-in, feed başına günlük tavan (kredi harcar). */}
        <div className="pt-2 border-t border-[#00F0FF]/15 space-y-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{t("autoDraft.label")}</span>
            <div className="relative shrink-0">
              <select
                value={autoDraftDaily}
                onChange={(e) => setAutoDraftDaily(Number(e.target.value))}
                aria-label={t("autoDraft.label")}
                className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer"
              >
                <option value={0}>{t("autoDraft.off")}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{t("autoDraft.perDay", { count: n })}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </label>
          <p className="text-[11px] text-muted-foreground/70">{t("autoDraft.hint")}</p>
          {autoDraftDaily > 0 && (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />{t("autoDraft.warning", { count: autoDraftDaily })}
            </p>
          )}
        </div>
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
