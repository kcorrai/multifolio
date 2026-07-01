"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDashboard } from "./dashboard-context";
import type { PlatformId } from "@/lib/ai/platforms";

/** /api/adapt çağrısı + oturum sonuç/harcama state'ini context üzerinden günceller. */
export function useAdapt() {
  const t = useTranslations("adapt");
  const { setAdaptResult, applyCredits } = useDashboard();
  const [adapting, setAdapting] = useState<PlatformId | null>(null);
  const [error, setError] = useState("");

  async function adapt(platform: PlatformId) {
    setAdapting(platform); setError("");
    const res = await fetch("/api/adapt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("adaptFailed")); setAdapting(null); return; }
    setAdaptResult(platform, body.output);
    if (body.credits) applyCredits(body.credits);
    setAdapting(null);
  }

  return { adapt, adapting, error };
}
