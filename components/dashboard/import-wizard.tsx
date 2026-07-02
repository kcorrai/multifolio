"use client";

// Onboarding profil içe aktarma: URL / metin / PDF → AI taslak → düzenle → kaydet.
// Taslak asla doğrudan kaydedilmez; kullanıcı her alanı düzenleyebilir.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles, Link2, ClipboardPaste, FileUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipsInput } from "./chips-input";
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";

type Channel = "url" | "text" | "file";

export function ImportWizard() {
  const t = useTranslations("import");
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);

  async function runImport() {
    setBusy(true); setError("");
    try {
      let res: Response;
      if (channel === "file") {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/profile/import", { method: "POST", body: form });
      } else {
        const body = channel === "url" ? { mode: "url", url: url.trim() } : { mode: "text", text };
        res = await fetch("/api/profile/import", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? t("saveError"));
        // URL çekilemediyse kullanıcıyı metin sekmesine yönlendir
        if (channel === "url") setChannel("text");
        return;
      }
      setDraft(data.draft as ProfileDraft);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true); setError("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? t("saveError")); setSaving(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const canImport = channel === "url" ? !!url.trim() : channel === "text" ? !!text.trim() : !!file;
  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const TABS: { id: Channel; icon: typeof Link2; label: string }[] = [
    { id: "url", icon: Link2, label: t("tabUrl") },
    { id: "text", icon: ClipboardPaste, label: t("tabText") },
    { id: "file", icon: FileUp, label: t("tabFile") },
  ];

  // --- Taslak inceleme ekranı ---
  if (draft) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center"><Sparkles className="h-6 w-6 text-[#00F0FF]" /></div>
          <h1 className="text-xl font-extrabold">{t("draftTitle")}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("headlineLabel")}</span>
            <input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} className={input} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("summaryLabel")}</span>
            <textarea rows={5} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className={`${input} resize-none`} />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("skillsLabel")}</span>
            <ChipsInput values={draft.skills} onChange={(next) => setDraft({ ...draft, skills: next })} placeholder={t("addSkill")} removeTitle={t("removeSkill")} max={50} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between pt-1">
            <button onClick={() => { setDraft(null); setError(""); }} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">{t("startOver")}</button>
            <Button onClick={saveDraft} disabled={saving} className="gap-2">{saving ? t("saving") : t("save")}<ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Kanal seçim ekranı ---
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center"><Sparkles className="h-6 w-6 text-[#00F0FF]" /></div>
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setChannel(id); setError(""); }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${channel === id ? "border-[#00F0FF]/50 bg-[#00F0FF]/5 text-foreground" : "border-border text-muted-foreground hover:border-border/80"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {channel === "url" && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("urlLabel")}</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("urlPlaceholder")} className={input} />
            <p className="text-[11px] text-muted-foreground/70">{t("urlHint")}</p>
          </label>
        )}
        {channel === "text" && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("textLabel")}</span>
            <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("textPlaceholder")} className={`${input} resize-none`} />
          </label>
        )}
        {channel === "file" && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("fileLabel")}</span>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={`${input} cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-semibold`} />
            <p className="text-[11px] text-muted-foreground/70">{t("fileHint")}</p>
          </label>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={runImport} disabled={busy || !canImport} className="w-full gap-2">
          {busy ? t("importing") : t("import")}<Sparkles className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-center">
        <Link href="/dashboard/profile" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">{t("skip")}</Link>
      </p>
    </div>
  );
}
