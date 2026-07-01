"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { PlatformId } from "@/lib/ai/platforms";
import type { AdaptOutput } from "./shared";

export interface DashboardCtx {
  /** Kümülatif AI harcaması (USD) — sekmeler arası canlı. */
  spend: number;
  addSpend: (usd: number) => void;
  /** Sidebar rozetleri — mutasyonlarda canlı güncellenir. */
  jobsCount: number;
  setJobsCount: Dispatch<SetStateAction<number>>;
  connectionsCount: number;
  setConnectionsCount: Dispatch<SetStateAction<number>>;
  /** Uyarlama sonuçları oturum boyunca (DB'ye kalıcı değil) sekmeler arası korunur. */
  adaptResults: Partial<Record<PlatformId, AdaptOutput>>;
  setAdaptResult: (platform: PlatformId, output: AdaptOutput) => void;
  /** Paylaşılan "yakında" bildirimi. */
  triggerComingSoon: () => void;
}

export const DashboardContext = createContext<DashboardCtx | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard, DashboardShell içinde kullanılmalı.");
  return ctx;
}
