"use client";

// Genel amaçlı görsel lightbox (galeri): bir fotoğrafa tıklanınca ekranın ortasında
// büyür; birden çok görsel verilirse ileri/geri (ok butonları + ← → klavye) ile gezilir.
// X'e, backdrop'a ya da Escape'e basınca kapanır. createPortal ile body'ye taşınır
// (derin kartlarda fixed overlay hapsolmasın). Site genelinde yeniden kullanılabilir.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxImage { src: string; alt?: string }

export function ImageLightbox({
  images, index = 0, onClose,
  closeLabel, prevLabel, nextLabel,
}: {
  images: LightboxImage[];
  index?: number;
  onClose: () => void;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  // Etiket verilmezse common namespace'inden (çağıranlar her yerde geçmek zorunda kalmaz).
  const tc = useTranslations("common");
  const cLabel = closeLabel ?? tc("close");
  const pLabel = prevLabel ?? tc("prev");
  const nLabel = nextLabel ?? tc("next");
  const count = images.length;
  const hasNav = count > 1;
  // index yalnız mount'ta okunur — çağıranlar kapanınca unmount eder, açınca taze mount.
  const [i, setI] = useState(index);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNav) setI((p) => (p + 1) % count);
      else if (e.key === "ArrowLeft" && hasNav) setI((p) => (p - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, hasNav, count]);

  const cur = images[Math.min(i, count - 1)];
  if (!cur) return null;
  const go = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setI((p) => (p + delta + count) % count);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        title={cLabel}
        aria-label={cLabel}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      {hasNav && (
        <>
          <button
            onClick={(e) => go(-1, e)}
            title={pLabel}
            aria-label={pLabel}
            className="absolute left-2 sm:left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => go(1, e)}
            title={nLabel}
            aria-label={nLabel}
            className="absolute right-2 sm:right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums text-white">
            {i + 1} / {count}
          </span>
        </>
      )}

      {/* Görsele tıklama kapatmayı tetiklemesin (yalnız dışına/backdrop). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cur.src}
        alt={cur.alt ?? ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
