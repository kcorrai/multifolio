"use client";

/* Landing "See it in action" videosunun bağlayıcısı.

   İki iş yapar:
   1) TEMBEL YÜKLEME — @remotion/player chunk'ı ancak bölüm görünüme YAKLAŞINCA
      (rootMargin 400px) import edilir. Böylece landing'in LCP'siyle yarışmaz;
      videoyu hiç görmeyen ziyaretçi hiç indirmez.
   2) TEMA — next-themes'ten çözülen tema paleti prop olarak kompozisyona geçer,
      sayfa açık/koyu moduna uyar (tema değişince Player inputProps ile tazelenir).

   Metin server component'ten `copy` prop'uyla gelir (i18n katalogda kalır). */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PALETTES } from "@/remotion/theme";
import type { ShowcaseCopy } from "@/remotion/ShowcaseVideo";

const ShowcaseVideoPlayer = dynamic(() => import("./showcase-video-player"), { ssr: false });

export function ShowcaseVideo({ copy }: { copy: ShowcaseCopy }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Tek yönlü: görünüme yaklaştıysa yükle ve bir daha izleme.
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // resolvedTheme ilk render'da undefined olabilir → koyu varsayılan (site defaultTheme'i).
  const palette = resolvedTheme === "light" ? PALETTES.light : PALETTES.dark;

  return (
    <div
      ref={hostRef}
      className="relative mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#0B0D14] dark:shadow-black/40"
    >
      {near ? (
        <ShowcaseVideoPlayer palette={palette} copy={copy} />
      ) : (
        // Yer tutucu: aynı en-boy oranı → CLS yok.
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/60 to-transparent dark:from-white/5" />
      )}
    </div>
  );
}
