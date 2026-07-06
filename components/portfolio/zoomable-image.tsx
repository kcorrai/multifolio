"use client";

// Tek görselli "tıkla → büyüt" sarmalayıcı (client): server sayfasındaki bir <img>'i
// (ör. public portfolyo hero avatarı) tıklanınca lightbox'ta ortalar. portfolioPublic
// i18n'ini kullanır.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageLightbox } from "@/components/image-lightbox";

export function ZoomableImage({
  src, alt, className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const t = useTranslations("portfolioPublic");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title={t("viewPhoto")} aria-label={t("viewPhoto")} className="cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
      </button>
      {open && (
        <ImageLightbox images={[{ src, alt }]} onClose={() => setOpen(false)} closeLabel={t("photoClose")} />
      )}
    </>
  );
}
