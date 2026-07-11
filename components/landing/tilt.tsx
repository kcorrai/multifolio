/* Saf CSS hareket sarmalayıcıları (sunucu bileşeni). Scroll parallax motoru
   `LandingMotion` kök değişkeni --sx; JS yok. (Mouse tilt kaldırıldı.) */

import type { CSSProperties, ReactNode } from "react";

/* Statik yükseklik sarmalayıcısı — `fill` grid hücresinde kartı tam yükseklik yapar. */
export function Tilt({
  children,
  className = "",
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return <div className={`${fill ? "h-full" : ""} ${className}`}>{children}</div>;
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
