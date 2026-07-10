"use client";

/* Landing hareket kontrolcüsü — TEK client bileşeni.
   Pointer + scroll'u dinler, kök CSS değişkenlerini günceller:
   --mx / --my  → fare konumu (-1..1, eased)   → kartlar 3D eğilir (sahneyle AYNI pointer)
   --sx         → sayfa scroll ilerlemesi (0..1) → dekoratif katmanlar sahneyle senkron kayar
   Geri kalan hareket saf CSS (bu değişkenleri okur) — böylece her element sunucuda
   render edilir, tek bir listener yeter. Hareket azaltma tercihinde hiç çalışmaz. */

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    let mx = 0, my = 0, tmx = 0, tmy = 0, sx = 0;
    let raf = 0, running = false;

    const tick = () => {
      running = false;
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      root.style.setProperty("--mx", mx.toFixed(4));
      root.style.setProperty("--my", my.toFixed(4));
      root.style.setProperty("--sx", sx.toFixed(4));
      if (Math.abs(tmx - mx) > 0.001 || Math.abs(tmy - my) > 0.001) schedule();
    };
    const schedule = () => {
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    };

    const onMove = (e: PointerEvent) => {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = (e.clientY / window.innerHeight) * 2 - 1;
      schedule();
    };
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      sx = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      schedule();
    };

    onScroll();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
