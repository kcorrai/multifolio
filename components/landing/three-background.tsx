"use client";

/* Landing arka planındaki sabit (fixed) WebGL katmanı.
   3D sahne yalnız client'ta yüklenir (ssr:false). Hareket azaltma tercihi
   veya küçük ekranlarda (perf) hiç yüklenmez — SSR/ilk bundle'a dokunmaz. */

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const ThreeScene = dynamic(() => import("./three-scene"), { ssr: false });

/* 3D'yi yalnız masaüstünde + hareket azaltma kapalıysa etkinleştir.
   useSyncExternalStore: SSR'da false, client'ta media query'lere göre;
   breakpoint/tercih değişince otomatik günceller (effect'te setState yok). */
function subscribe(cb: () => void) {
  const m1 = window.matchMedia("(prefers-reduced-motion: reduce)");
  const m2 = window.matchMedia("(max-width: 767px)");
  m1.addEventListener("change", cb);
  m2.addEventListener("change", cb);
  return () => {
    m1.removeEventListener("change", cb);
    m2.removeEventListener("change", cb);
  };
}

function useSceneEnabled() {
  return useSyncExternalStore(
    subscribe,
    () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

export function ThreeBackground() {
  const enabled = useSceneEnabled();

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-45 dark:opacity-100"
      style={{
        maskImage:
          "radial-gradient(ellipse 75% 70% at 50% 42%, black 45%, transparent 88%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 75% 70% at 50% 42%, black 45%, transparent 88%)",
      }}
    >
      <ThreeScene />
    </div>
  );
}
