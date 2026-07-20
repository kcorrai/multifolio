"use client";

// "Uzantı nasıl kullanılır?" rehber modalı: platform detay (Upwork/Fiverr) boş
// durumundan açılır. Medya alanı: gerçek video URL'i varsa (EXTENSION_DEMO_VIDEO_URL)
// gömer; yoksa animasyonlu mock anlatım (import butonunun profilde nerede çıktığını
// gösterir). Adım adım yönerge + mağaza/gizlilik linkleri. createPortal ile body'ye
// taşınır (fixed overlay derin kartlarda hapsolmasın — [[responsive-scale-and-cron]]).
import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X, Puzzle, LogIn, MousePointerClick, FileCheck2, Download, MousePointer2, BadgeCheck, Star, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXTENSION_STORE_URL, EXTENSION_DEMO_VIDEO_URL, isEmbedVideoUrl } from "@/lib/extension";

const STEP_ICONS: LucideIcon[] = [Download, LogIn, MousePointerClick, FileCheck2];

// Modalı açan platforma göre gerçekçi profil URL'i (mock tarayıcı adres çubuğu).
const PROFILE_HOST: Record<string, string> = {
  upwork: "upwork.com/freelancers/~you",
  fiverr: "fiverr.com/you",
  "99designs": "99designs.com/profiles/you",
};

// Gerçek video hazır olduğunda gösterilen oynatıcı; yoksa animasyonlu mock.
function DemoMedia({ caption, buttonLabel, host }: { caption: string; buttonLabel: string; host: string }) {
  if (EXTENSION_DEMO_VIDEO_URL) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {isEmbedVideoUrl(EXTENSION_DEMO_VIDEO_URL) ? (
          <iframe
            src={EXTENSION_DEMO_VIDEO_URL}
            title="demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video src={EXTENSION_DEMO_VIDEO_URL} controls className="h-full w-full" />
        )}
      </div>
    );
  }

  // Animasyonlu mock: mini tarayıcı + GERÇEKÇİ (beyaz zeminli) profil + yüzen "içe aktar"
  // butonu (pulse + imleç). Gerçek profil sayfası gibi görünsün — koyu iskelet değil.
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        {/* Tarayıcı çubuğu (açık gri — gerçek tarayıcı) */}
        <div className="flex items-center gap-2 bg-slate-200 px-3 py-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="ml-1 flex-1 truncate rounded-md bg-white px-2 py-1 text-xs text-slate-500">
            {host}
          </span>
        </div>

        {/* Gerçekçi profil (beyaz zemin, koyu metin) */}
        <div className="relative bg-white p-4 text-slate-900">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-base">AR</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm truncate">Alex Rivera</p>
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 truncate">Senior Product &amp; 3D Designer</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />5.0 (48)</span>
                <span aria-hidden>·</span>
                <span className="font-semibold text-slate-700">$45/hr</span>
                <span aria-hidden>·</span>
                <span>Istanbul, TR</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
            I design and build polished digital products — from brand identity to interactive 3D experiences that help teams ship faster.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["UI/UX", "Figma", "Blender", "Webflow", "3D"].map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{s}</span>
            ))}
          </div>

          {/* Yüzen "içe aktar" butonu — dikkat çekmek için pulse + halka + imleç */}
          <div className="absolute bottom-3 right-3">
            <span className="absolute inset-0 rounded-lg bg-[#00F0FF]/50 animate-ping motion-reduce:hidden" />
            <span className="relative inline-flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-2.5 py-1.5 text-xs font-bold text-[#031014] shadow-lg">
              <Puzzle className="h-3.5 w-3.5" />{buttonLabel}
            </span>
            <MousePointer2 className="absolute -bottom-2 -right-1 h-4 w-4 text-slate-900 drop-shadow motion-safe:animate-bounce" />
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

export function ExtensionGuideModal({ platform = "upwork", onClose }: { platform?: string; onClose: () => void }) {
  const t = useTranslations("extensionGuide");
  const host = PROFILE_HOST[platform] ?? PROFILE_HOST.upwork;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ext-guide-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <Puzzle className="h-4 w-4 shrink-0 text-[#00F0FF]" />
            <div className="min-w-0">
              <h2 id="ext-guide-title" className="font-semibold text-sm truncate">{t("title")}</h2>
              <p className="text-xs text-muted-foreground truncate">{t("subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <DemoMedia caption={t("demoCaption")} buttonLabel={t("importButton")} host={host} />

          {/* Adım adım */}
          <ol className="space-y-3">
            {[0, 1, 2, 3].map((i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00F0FF]/10 text-[#00F0FF]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      <span className="text-muted-foreground tabular-nums mr-1.5">{i + 1}.</span>
                      {t(`step${i + 1}.title`)}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t(`step${i + 1}.desc`)}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Footer aksiyonlar */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button asChild size="sm" className="gap-1.5">
              <a href={EXTENSION_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />{t("install")}
              </a>
            </Button>
            <Link href="/extension/privacy" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
              {t("privacyLink")}
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
