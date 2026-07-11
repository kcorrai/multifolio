"use client";

/* Landing hareket kontrolcüsü — TEK client bileşeni.
   Scroll'u dinler, kök CSS değişkenini günceller:
   --sx → sayfa scroll ilerlemesi (0..1) → dekoratif katmanlar senkron kayar (drift-x).
   Geri kalan hareket saf CSS (bu değişkeni okur). Hareket azaltma tercihinde çalışmaz. */

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const sx = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      root.style.setProperty("--sx", sx.toFixed(4));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
