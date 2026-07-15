"use client";

// Haftalık özet e-postası tercihi (Dalga 3): ince satır-kart, Overview altında.
// Değer mount'ta GET /api/settings'ten gelir; değişiklik anında PATCH edilir
// (referral-card self-fetch deseni). Hata durumunda kart sessizce gizlenir.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";

export function WeeklyDigestToggle() {
  const t = useTranslations("dashboard.weeklyDigest");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b) => { if (!cancelled) setEnabled((b as { weeklyDigest: boolean }).weeklyDigest); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed) return null; // kart kritik değil — hata durumunda sessizce gizlenir

  async function toggle(next: boolean) {
    const prev = enabled;
    setEnabled(next); // iyimser güncelleme; PATCH patlarsa geri alınır
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyDigest: next }),
    }).catch(() => null);
    if (!res?.ok) setEnabled(prev);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <Mail className="h-4 w-4 text-[#00F0FF] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{t("label")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("hint")}</p>
      </div>
      {enabled === null ? (
        <div className="h-4 w-4 rounded bg-muted/70 animate-pulse shrink-0" />
      ) : (
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
          aria-label={t("label")}
          className="h-4 w-4 accent-[#00F0FF] cursor-pointer shrink-0"
        />
      )}
    </div>
  );
}
