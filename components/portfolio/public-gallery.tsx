"use client";

// Public portfolyo galerisi (client): masonry görselleri render eder; bir görsele
// tıklanınca lightbox açılır ve foto arası ileri/geri gezilebilir. Server sayfası
// (/p/[slug]) bunu yalnız görsel listesi + yedek alt metniyle çağırır.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";

export function PublicGallery({
  images, fallbackAlt,
}: {
  images: { url: string; caption?: string | null }[];
  fallbackAlt: string;
}) {
  const t = useTranslations("portfolioPublic");
  const [index, setIndex] = useState<number | null>(null);
  const lb: LightboxImage[] = images.map((im) => ({ src: im.url, alt: im.caption || fallbackAlt }));

  return (
    <>
      <div className="mt-5 gap-4 [column-fill:_balance] columns-1 sm:columns-2 lg:columns-3">
        {images.map((item, i) => (
          <figure
            key={item.url}
            className="anim-fade-up mb-4 break-inside-avoid overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group"
            style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
          >
            <button type="button" onClick={() => setIndex(i)} title={item.caption || fallbackAlt} className="block w-full cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || fallbackAlt}
                loading="lazy"
                decoding="async"
                /* aspect-ratio yükleme öncesi yer ayırır → sütun akışı kaymaz (CLS). */
                className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
            {item.caption && (
              <figcaption className="px-3 py-2 text-xs text-[var(--pf-muted)]">{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {index !== null && (
        <ImageLightbox
          images={lb}
          index={index}
          onClose={() => setIndex(null)}
          closeLabel={t("photoClose")}
          prevLabel={t("photoPrev")}
          nextLabel={t("photoNext")}
        />
      )}
    </>
  );
}
