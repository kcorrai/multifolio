"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  /* ms cinsinden sayma süresi */
  duration?: number;
  /* ms cinsinden başlama gecikmesi (hero mockup senkronu için) */
  delay?: number;
  className?: string;
}

/* Görünüme girince 0'dan hedefe sayar. JS yokken / reduced-motion'da hedef değer görünür. */
export function CountUp({ value, prefix = "", suffix = "", duration = 1200, delay = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out — giriş animasyonu kuralı
            el.textContent = prefix + Math.round(value * eased) + suffix;
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          el.textContent = prefix + 0 + suffix;
          raf = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, prefix, suffix, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value}{suffix}
    </span>
  );
}
