"use client";

// Onboarding profil içe aktarma: URL / metin / PDF → AI taslak → düzenle → kaydet.
// Taslak asla doğrudan kaydedilmez; kullanıcı her alanı düzenleyebilir.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles, Link2, ClipboardPaste, FileUp, ArrowRight, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import { ChipsInput } from "./chips-input";
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";

type Channel = "url" | "text" | "file";
// Yapılandırılmış içe aktarmada (Bionluk/LinkedIn/Upwork) taslakla gelen görseller + projeler.
type ImportExtras = { avatarUrl: string | null; portfolio: PortfolioItem[]; projects?: ProfileProject[] };

interface ImportWizardProps {
  // Tarayıcı eklentisi akışı: sunucu sayfası bekleyen taslağı okuyup buraya geçirir —
  // wizard doğrudan inceleme ekranında açılır. Normal akışta hepsi boş.
  initialDraft?: ProfileDraft | null;
  initialExtras?: ImportExtras | null;
  initialPlatformLabel?: string | null;
  // Kaynak platform id'si (upwork/fiverr/…): save'de platform bazlı merge için gönderilir
  // (bu platformun projeleri yenilenir, diğer platformlarınki korunur). null = manuel kaynak.
  initialPlatform?: string | null;
}

export function ImportWizard({ initialDraft = null, initialExtras = null, initialPlatformLabel = null, initialPlatform = null }: ImportWizardProps = {}) {
  const t = useTranslations("import");
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ProfileDraft | null>(initialDraft);
  const [extras, setExtras] = useState<ImportExtras | null>(initialExtras);
  // Veri kaynak dilinde aktarılır; kullanıcı isterse kendi diline çevirir (orijinal
  // korunur, "orijinali göster" ile geri döner).
  const [original, setOriginal] = useState<ProfileDraft | null>(initialDraft);
  const [translating, setTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  // Kaynak banner'ı yalnız eklentiden gelen taslakta gösterilir; kullanıcı
  // baştan başlayıp yeni içe aktarma yaparsa kapanır.
  const [fromExtension, setFromExtension] = useState(!!initialDraft && !!initialPlatformLabel);
  // Save'de platform bazlı merge için kaynak platform (extension'dan gelir; URL/metin
  // içe aktarmasında import yanıtındaki data.platform ile güncellenir).
  const [sourcePlatform, setSourcePlatform] = useState<string | null>(initialPlatform);
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
      setOriginal(data.draft as ProfileDraft);
      setIsTranslated(false);
      setExtras((data.media as ImportExtras | undefined) ?? null);
      setSourcePlatform((data.platform as string | null) ?? null); // merge kaynağı
      setFromExtension(false);
    } finally {
      setBusy(false);
    }
  }

  // İçe aktarılan taslağı kullanıcının UI diline çevirir (ücretsiz; orijinal saklı kalır).
  async function translateDraft() {
    if (!draft) return;
    setTranslating(true); setError("");
    try {
      const res = await fetch("/api/profile/import/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: draft.headline, summary: draft.summary, skills: draft.skills }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error?.message ?? t("translateError")); return; }
      setDraft({ ...draft, ...(data.draft as ProfileDraft) });
      setIsTranslated(true);
    } finally {
      setTranslating(false);
    }
  }

  function showOriginal() {
    if (original) { setDraft(original); setIsTranslated(false); }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true); setError("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        // Görseller/projeler yalnız varsa gönderilir (avatar_url geçerli URL olmalı).
        ...(extras?.avatarUrl ? { avatar_url: extras.avatarUrl } : {}),
        ...(extras?.portfolio?.length ? { portfolio: extras.portfolio } : {}),
        ...(extras?.projects?.length ? { projects: extras.projects } : {}),
        // Bu bir İÇE AKTARMA save'i → sunucu platform bazlı merge etsin (null=manuel de
        // gönderilir ki diğer platformların projeleri korunsun, ezilmesin).
        sourcePlatform,
      }),
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
          {extras?.avatarUrl ? (
            // Bionluk dış görseli — tıklanınca lightbox'ta büyür.
            <button type="button" onClick={() => setLightbox({ images: [{ src: extras.avatarUrl as string, alt: t("photoAlt") }], index: 0 })} className="mx-auto block cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={extras.avatarUrl} alt={t("photoAlt")} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#00F0FF]/30" />
            </button>
          ) : (
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center"><Sparkles className="h-6 w-6 text-[#00F0FF]" /></div>
          )}
          <h1 className="text-xl font-extrabold">{t("draftTitle")}</h1>
          {fromExtension && initialPlatformLabel && (
            <p className="inline-block rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-3 py-1 text-xs text-muted-foreground">
              {t("extensionSource", { platform: initialPlatformLabel })}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {/* Veri kaynak dilinde geldi — kullanıcı isterse kendi diline çevirir. */}
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{isTranslated ? t("translatedNote") : t("translateHint")}</p>
            {isTranslated ? (
              <button onClick={showOriginal} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer">
                <Languages className="h-3.5 w-3.5" />{t("showOriginal")}
              </button>
            ) : (
              <button onClick={translateDraft} disabled={translating} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer disabled:opacity-50">
                <Languages className="h-3.5 w-3.5" />{translating ? t("translating") : t("translateToMine")}
              </button>
            )}
          </div>
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
          {/* Yapılandırılmış projeler (Upwork) — her proje ayrı: başlık/rol/açıklama/beceri/görsel. */}
          {extras && extras.projects && extras.projects.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">{t("projectsLabel", { count: extras.projects.length })}</span>
              <div className="space-y-3">
                {extras.projects.map((p, pi) => {
                  const imgs: LightboxImage[] = p.images.filter((im) => im.url).map((im) => ({ src: im.url, alt: im.caption || p.title }));
                  return (
                    <div key={pi} className="rounded-xl border border-border p-3 space-y-2">
                      <div>
                        <p className="text-sm font-bold leading-snug">{p.title}</p>
                        {p.role && <p className="text-[11px] font-semibold text-[#00F0FF]/80">{p.role}</p>}
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>}
                      {p.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.skills.map((s) => (
                            <span key={s} className="rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}
                      {imgs.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {imgs.map((img, k) => (
                            <button key={img.src + k} type="button" onClick={() => setLightbox({ images: imgs, index: k })} title={img.alt} className="cursor-zoom-in">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.src} alt={img.alt} className="aspect-square w-full rounded-md object-cover border border-border transition-transform hover:scale-105" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {extras && extras.portfolio.length > 0 && !(extras.projects && extras.projects.length) && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{t("portfolioLabel", { count: extras.portfolio.length })}</span>
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const imgs: LightboxImage[] = extras.portfolio.filter((p) => p.imageUrl).map((p) => ({ src: p.imageUrl as string, alt: p.title }));
                  return imgs.slice(0, 8).map((img, i) => (
                    <button key={img.src + i} type="button" onClick={() => setLightbox({ images: imgs, index: i })} title={img.alt} className="cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.alt} className="aspect-square w-full rounded-lg object-cover border border-border transition-transform hover:scale-105" />
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between pt-1">
            <button onClick={() => { setDraft(null); setOriginal(null); setExtras(null); setError(""); setFromExtension(false); setIsTranslated(false); }} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">{t("startOver")}</button>
            <Button onClick={saveDraft} disabled={saving} className="gap-2">{saving ? t("saving") : t("save")}<ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
        {lightbox && (
          <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />
        )}
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
