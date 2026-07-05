"use client";

// Profil gücü kartı: yüzde + ilerleme çubuğu + eksik maddelerin linkli
// checklist'i. Onboarding banner'ın aksine KALICI — %100'de kutlama durumuna
// döner. Hesap sunucuda (lib/profile-strength), bu bileşen yalnız render eder.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gauge, Check, ArrowRight } from "lucide-react";
import type { ProfileStrengthResult } from "@/lib/profile-strength";

function barColor(percent: number): string {
  if (percent >= 75) return "bg-green-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function ProfileStrengthCard({ strength }: { strength: ProfileStrengthResult }) {
  const t = useTranslations("dashboard.profileStrength");
  const missing = strength.items.filter((i) => !i.done);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#00F0FF]" />
          {t("title")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#00F0FF]/10 px-2 py-0.5 text-[11px] font-bold text-[#0891b2] dark:text-[#00F0FF]">
            {t(`stage.${strength.stage}`)}
          </span>
          <span className="text-lg font-extrabold tabular-nums">{t("percent", { percent: strength.percent })}</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(strength.percent)}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>

      {missing.length === 0 ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
          <Check className="h-3.5 w-3.5" />{t("complete")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {missing.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5 transition-colors"
                >
                  <span>{t(`items.${item.key}`)}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-[#0891b2] dark:text-[#00F0FF]">{t("step", { percent: strength.stepPercent })}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Opsiyonel bonus (yüzdeye girmez; içe aktarmadan gelir) — çelişki yaratmasın diye "opsiyonel" etiketli. */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-muted-foreground/70">{t("bonusLabel")}</span>
        {strength.bonus.map((b) => (
          <Link
            key={b.key}
            href={b.href}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
              b.done
                ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                : "border-border text-muted-foreground hover:text-foreground hover:border-[#00F0FF]/30"
            }`}
          >
            {b.done && <Check className="h-3 w-3" />}
            {t(`items.${b.key}`)}
          </Link>
        ))}
      </div>
    </div>
  );
}
