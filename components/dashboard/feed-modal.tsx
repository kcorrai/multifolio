"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("feed");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setError("");
    const body = {
      name: name.trim(),
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
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
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.keywordsLabel")}</span>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={t("modal.keywordsPlaceholder")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
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
