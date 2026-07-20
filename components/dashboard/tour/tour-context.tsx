"use client";

// Onboarding turu state'i — DashboardShell (layout) içinde yaşar, sekme route
// değişimlerinde unmount OLMAZ → tur ilerleyişi navigasyon boyunca korunur.
// Kalıcılık cihaz başına localStorage ("done" | "skipped"); backend yok.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { TOUR_STEPS, TOUR_TOTAL, type TourStep } from "./steps";

/** Turun "görüldü" damgası. Dev araçları da bunu temizler → tek kaynak, string tekrarı yok. */
export const TOUR_STORAGE_KEY = "mf_tour_v1";
const STORAGE_KEY = TOUR_STORAGE_KEY;

function persistTour(v: "done" | "skipped") {
  try { localStorage.setItem(STORAGE_KEY, v); } catch { /* SSR/private-mode: yok say */ }
}
function clearTour() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* yok say */ }
}

interface TourCtx {
  active: boolean;
  stepIndex: number;
  step: TourStep | null;
  total: number;
  start: () => void;
  next: () => void;
  back: () => void;
  skipTour: () => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function useTour() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTour, TourProvider içinde kullanılmalı.");
  return c;
}

export function TourProvider({ hasProfile, children }: { hasProfile: boolean; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Otomatik başlatma: profilsiz yeni kullanıcı + daha önce görülmemiş (tek sefer).
  // setState rAF ile ertelenir (effect içinde senkron setState yasak — set-state-in-effect).
  useEffect(() => {
    if (hasProfile) return;
    let seen: string | null = null;
    try { seen = localStorage.getItem(STORAGE_KEY); } catch { /* yok say */ }
    if (seen) return;
    const id = requestAnimationFrame(() => { setStepIndex(0); setActive(true); });
    return () => cancelAnimationFrame(id);
  }, [hasProfile]);

  const start = useCallback(() => {
    clearTour();
    setStepIndex(0);
    setActive(true);
  }, []);

  const skipTour = useCallback(() => {
    setActive(false);
    persistTour("skipped");
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_TOTAL - 1) {
      // Son adımı geçmek turu tamamlar.
      setActive(false);
      persistTour("done");
    } else {
      setStepIndex(stepIndex + 1);
    }
  }, [stepIndex]);

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  const step = active ? TOUR_STEPS[stepIndex] ?? null : null;

  return (
    <Ctx.Provider value={{ active, stepIndex, step, total: TOUR_TOTAL, start, next, back, skipTour }}>
      {children}
    </Ctx.Provider>
  );
}
