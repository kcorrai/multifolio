/* Saf CSS hareket sarmalayıcıları (sunucu bileşeni) — motoru `LandingMotion`
   kök değişkenleri (--mx/--my/--sx). Buradaki bileşenler sadece doğru class'ları
   ve derinlik değişkenlerini koyar; JS yok. */

import type { CSSProperties, ReactNode } from "react";

/* Fareye göre 3D eğilen kart — sahneyle AYNI pointer sinyalini okur. */
export function Tilt({
  children,
  className = "",
  strong = false,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  fill?: boolean;
}) {
  const h = fill ? "h-full" : "";
  return (
    <div className={`tilt-3d ${h} ${strong ? "tilt-3d--strong" : ""} ${className}`}>
      <div className={`tilt-3d__i ${h}`}>{children}</div>
    </div>
  );
}

/* Scroll'da katmanlı parallax (element viewport'tan geçerken kayar).
   view() timeline destekleyen tarayıcıda (Chromium) çalışır; diğerlerinde
   sessizce statik kalır. from/to = px cinsinden başlangıç/bitiş ötelemesi. */
export function Parallax({
  children,
  from = 40,
  to = -40,
  className = "",
  style,
}: {
  children: ReactNode;
  from?: number;
  to?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`par ${className}`}
      style={{ "--par-from": `${from}px`, "--par-to": `${to}px`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
