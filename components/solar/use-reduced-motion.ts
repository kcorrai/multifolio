"use client";

// `prefers-reduced-motion` aboneliği. useSyncExternalStore ile okunur:
// effect içinde setState çağırmaz (kaskad render yok) ve sunucu anlık görüntüsü
// `false` olduğu için hidrasyon uyuşmazlığı çıkarmaz — hareket, ilk boyamadan
// hemen sonra tercihe göre kapanır.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
