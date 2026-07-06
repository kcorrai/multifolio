"use client";

// Genel amaçlı görsel lightbox: bir fotoğrafa tıklanınca ekranın ortasında büyütür.
// X'e, backdrop'a ya da Escape'e basınca kapanır. createPortal ile body'ye taşınır
// (derin kartlarda fixed overlay hapsolmasın). Site genelinde yeniden kullanılabilir.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ImageLightbox({
  src, alt = "", closeLabel = "Close", onClose,
}: {
  src: string;
  alt?: string;
  closeLabel?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        title={closeLabel}
        aria-label={closeLabel}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
      {/* Görsele tıklama kapatmayı tetiklemesin (yalnız dışına/backdrop). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
