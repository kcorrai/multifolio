"use client";

// Profil güç paneli: SAF assessProfileStrength'i canlı gösterir (skor + kanıta dayalı
// checklist). Kredisiz/anlık — kullanıcı yazarken güçlenir. Vollna/UpHunt "profil audit"
// farklılaştırıcısı ama ücretsiz. Tamamlanma halkasından FARKLI: alan-doluluğu değil KALİTE
// (anahtar kelime, somut kanıt, güçlü açılış, klişe yok) ölçer.
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { assessProfileStrength, type ProfileStrengthInput, type ProfileStrength as PS } from "@/lib/profile/optimization";

const BAND_STYLE: Record<PS["band"], string> = {
  strong: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  good: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/25",
  fair: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  weak: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
};

export function ProfileStrength({ headline, summary, skills }: ProfileStrengthInput) {
  const t = useTranslations("profileStrength");
  const r = assessProfileStrength({ headline, summary, skills });
  // Geçmeyen kontroller üstte (aksiyon önce), geçenler altta.
  const sorted = [...r.checks].sort((a, b) => Number(a.passed) - Number(b.passed));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{t("title")}</p>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${BAND_STYLE[r.band]}`}>
          {r.score} · {t(`band.${r.band}`)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${r.band === "weak" ? "bg-red-500" : r.band === "fair" ? "bg-amber-500" : r.band === "good" ? "bg-[#00F0FF]" : "bg-emerald-500"}`}
          style={{ width: `${r.score}%` }}
        />
      </div>
      <ul className="space-y-1">
        {sorted.map((c) => (
          <li key={c.id} className={`flex items-start gap-1.5 text-[11px] ${c.passed ? "text-muted-foreground/60" : "text-foreground"}`}>
            {c.passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px text-emerald-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 mt-px text-muted-foreground/40" />
            )}
            <span className={c.passed ? "line-through decoration-muted-foreground/30" : ""}>{t(`check.${c.id}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
