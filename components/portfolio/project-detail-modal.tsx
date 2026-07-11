"use client";

// Upwork tarzı proje detay modalı (client, yeniden kullanılabilir): ekranın önüne
// gelen kutu — sol sütun rol/açıklama/beceriler, sağ sütun görseller; görsele tıklanınca
// tam ekran lightbox. Hem public portfolyo (/p/[slug], preset teması) hem dashboard
// profil sekmesi (dashboard teması) kullanır.
//
// ÖNEMLİ: createPortal ile body'ye taşınır → sayfadaki --pf-* değişkenleri portal içine
// KADAR ULAŞMAZ. Bu yüzden tema `vars` prop'u olarak portal KÖK'üne uygulanır (public
// sayfa preset vars'ını, profil sekmesi dashboard token'larını eşler).
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";

export interface ShowcaseProject {
  title: string;
  role?: string;
  description?: string;
  skills?: string[];
  images: { url: string; caption?: string | null }[];
}

export function ProjectDetailModal({
  project, fallbackAlt, onClose, vars,
}: {
  project: ShowcaseProject;
  fallbackAlt: string;
  onClose: () => void;
  /** Portal kök'üne uygulanan tema değişkenleri (--pf-bg/-surface/-text/-muted/-border/-accent/…). */
  vars?: CSSProperties;
}) {
  const t = useTranslations("portfolioPublic");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lb: LightboxImage[] = project.images.map((im) => ({ src: im.url, alt: im.caption || project.title || fallbackAlt }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div
      style={vars}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      /* Yalnız backdrop'un kendisine tıklayınca kapat — iç içe ImageLightbox portalı
         React ağacında olay kabarcıklanmasıyla buraya ulaşıp modalı yanlışça kapatmasın. */
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--pf-body-font)" }}
        className="anim-fade-up relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-bg)] text-[var(--pf-text)] shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label={t("photoClose")}
          title={t("photoClose")}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] text-[var(--pf-muted)] transition-colors hover:text-[var(--pf-text)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[88vh] overflow-y-auto p-6 sm:p-8">
          <h2 style={{ fontFamily: "var(--pf-heading-font)" }} className="max-w-[90%] text-2xl font-bold leading-tight sm:text-3xl">
            {project.title || t("projects")}
          </h2>

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            {/* Sol: meta */}
            <div className="space-y-6">
              {project.role && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-muted)]">{t("projectRole")}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--pf-text)]">{project.role}</p>
                </div>
              )}
              {project.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-muted)]">{t("projectDescription")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-text)]/90">{project.description}</p>
                </div>
              )}
              {(project.skills?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-muted)]">{t("projectSkills")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.skills!.map((s) => (
                      <span key={s} className="rounded-md border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2.5 py-1 text-xs font-medium text-[var(--pf-text)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ: görseller (tıklanınca tam ekran) */}
            <div className="space-y-3">
              {project.images.map((im, k) => (
                <button
                  key={im.url + k}
                  type="button"
                  onClick={() => setLightbox(k)}
                  title={im.caption || project.title}
                  className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={im.url}
                    alt={im.caption || project.title || fallbackAlt}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-contain transition-transform duration-500 hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <ImageLightbox
          images={lb}
          index={lightbox}
          onClose={() => setLightbox(null)}
          closeLabel={t("photoClose")}
          prevLabel={t("photoPrev")}
          nextLabel={t("photoNext")}
        />
      )}
    </div>,
    document.body,
  );
}
