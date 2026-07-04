"use client";

// Etiket (chip) girişi: Enter/virgül ekler, boş inputta Backspace son chip'i
// siler, + butonu ekler. Trim + tekilleştirme + limit korumalı.
// FeedModal (keywords, ülke hariç tutma) ve Profil (skills) paylaşır.
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChipsInput({
  values, onChange, placeholder, removeTitle, max = 10, id,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  removeTitle: string;
  max?: number;
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    const exists = values.some((k) => k.toLowerCase() === v.toLowerCase());
    if (!exists && values.length < max) onChange([...values, v]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={add} disabled={!draft.trim() || values.length >= max} className="shrink-0" aria-label={placeholder}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              {v}
              <button type="button" onClick={() => onChange(values.filter((k) => k !== v))} className="text-muted-foreground/60 hover:text-foreground" title={removeTitle} aria-label={`${removeTitle}: ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
