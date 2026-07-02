"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_KEYWORDS = 10;

export function FeedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("feed");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kw, setKw] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Girilen keyword'ü chip olarak ekler (trim + tekilleştir + limit).
  function addKeyword() {
    const v = kw.trim();
    if (!v) return;
    setKeywords((prev) => (prev.includes(v) || prev.length >= MAX_KEYWORDS ? prev : [...prev, v]));
    setKw("");
  }

  function onKeyInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); }
    else if (e.key === "Backspace" && kw === "" && keywords.length > 0) {
      setKeywords((prev) => prev.slice(0, -1));
    }
  }

  function removeKeyword(v: string) {
    setKeywords((prev) => prev.filter((k) => k !== v));
  }

  async function save() {
    setSaving(true); setError("");
    const body = {
      name: name.trim(),
      keywords,
      minBudget: minBudget ? Number(minBudget) : undefined,
    };
    const res = await fetch("/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? "Error"); setSaving(false); return; }
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t("modal.title")}</h3>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.nameLabel")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("modal.namePlaceholder")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.keywordsLabel")}</span>
            <div className="flex gap-2">
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                onKeyDown={onKeyInput}
                placeholder={t("modal.addKeyword")}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="button" variant="outline" size="icon" onClick={addKeyword} disabled={!kw.trim() || keywords.length >= MAX_KEYWORDS} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {k}
                    <button type="button" onClick={() => removeKeyword(k)} className="text-muted-foreground/60 hover:text-foreground" title={t("modal.removeKeyword")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/70">{t("modal.keywordsHint")}</p>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minBudgetLabel")}</span>
            <input value={minBudget} onChange={(e) => setMinBudget(e.target.value)} inputMode="numeric" placeholder="500" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
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
