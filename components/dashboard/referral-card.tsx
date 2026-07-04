"use client";

// Davet kartı: kullanıcının referral linki (kopyalanabilir) + istatistik.
// Kod mount'ta GET /api/referral'dan gelir (yoksa sunucu üretir); davet
// linkinin origin'i client'ta kurulur (window.location.origin).
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import { CopyButton } from "./copy-button";

interface ReferralInfo {
  code: string;
  invited: number;
  creditsEarned: number;
}

export function ReferralCard() {
  const t = useTranslations("dashboard.referral");
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referral")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b) => { if (!cancelled) setInfo(b as ReferralInfo); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed) return null; // kart kritik değil — hata durumunda sessizce gizlenir

  const inviteUrl = info ? `${window.location.origin}/signup?ref=${info.code}` : "";

  return (
    <div className="rounded-2xl border border-violet-500/15 dark:border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Gift className="h-4 w-4 text-violet-400" />
          {t("title")}
        </h3>
        {info && (
          <span className="text-xs font-semibold text-violet-500 dark:text-violet-300 tabular-nums">
            {t("stats", { invited: info.invited, credits: info.creditsEarned })}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("body", { bonus: 20 })}</p>
      {info ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
          <code className="flex-1 min-w-0 truncate text-xs">{inviteUrl}</code>
          <CopyButton text={inviteUrl} />
        </div>
      ) : (
        <div className="h-9 rounded-lg bg-muted/50 animate-pulse" />
      )}
    </div>
  );
}
