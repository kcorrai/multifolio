// Saf kurulum ilerlemesi hesabı. Yüzde YALNIZ ulaşılabilir 6 çekirdek maddeden
// gelir (profil alanları + platform kurulum döngüsü) → manuel (metin/PDF) kullanıcı
// da %100'e ulaşabilir. Avatar + portfolyo yalnız içe aktarmadan gelebildiği için
// (manuel yükleme yok) yüzdeyi KAPATMAYAN opsiyonel BONUS'tur. Server component
// (dashboard) hesaplar, UI render eder. Bkz. docs/DASHBOARD-REVIEW-BACKLOG.md P0-3.

export interface ProfileStrengthInput {
  headline: string | null;
  summary: string | null;
  skills: string[] | null;
  avatarUrl: string | null;
  portfolioCount: number | null;
  connectionsCount: number | null;
  platformProfilesCount: number | null;
  adaptationsCount: number | null;
}

export type ProfileStrengthKey =
  | "headline"
  | "summary"
  | "skills"
  | "platformConnected"
  | "platformDataFetched"
  | "adapted";

export type ProfileBonusKey = "avatar" | "portfolio";

// Kademeler (LinkedIn "All-Star" deseni): yüzdeyi somut bir hedefe bağlar → kullanıcı
// bir sonraki eşiği görür. Eşikler UI bar renkleriyle uyumlu (40/75 civarı).
export type ProfileStrengthStage = "start" | "shaping" | "strong" | "allstar";

export function profileStrengthStage(percent: number): ProfileStrengthStage {
  if (percent >= 100) return "allstar";
  if (percent >= 67) return "strong";
  if (percent >= 34) return "shaping";
  return "start";
}

export interface ProfileStrengthItem {
  key: ProfileStrengthKey;
  done: boolean;
  /** Madde eksikse kullanıcının gideceği sayfa. */
  href: string;
}

export interface ProfileBonusItem {
  key: ProfileBonusKey;
  done: boolean;
  href: string;
}

export interface ProfileStrengthResult {
  percent: number;
  /** Yüzdeden türeyen kademe (start/shaping/strong/allstar). */
  stage: ProfileStrengthStage;
  /** Her çekirdek maddenin yüzdeye katkısı (şeffaflık: "+{stepPercent}%"). */
  stepPercent: number;
  items: ProfileStrengthItem[];
  /** Yüzdeye SAYILMAYAN opsiyonel maddeler (içe aktarmadan gelir). */
  bonus: ProfileBonusItem[];
}

// Çekirdek alan-tamamlanma eşikleri — TEK DOĞRU KAYNAK. Hem bu fonksiyon (Overview
// "Kurulum ilerlemesi") hem ProfileTab hero halkası bu predicate'leri kullanır ki
// "headline='a' halkada dolu ama strength'te değil" çelişkisi olmasın.
export const isHeadlineComplete = (headline: string | null): boolean =>
  (headline ?? "").trim().length >= 20;
export const isSummaryComplete = (summary: string | null): boolean =>
  (summary ?? "").trim().length >= 80;
export const areSkillsComplete = (skills: string[] | null): boolean =>
  (skills ?? []).length >= 5;

// Çekirdek madde sırası UI'daki checklist sırasıdır (profil alanları → platform döngüsü).
export function computeProfileStrength(input: ProfileStrengthInput): ProfileStrengthResult {
  const items: ProfileStrengthItem[] = [
    { key: "headline", done: isHeadlineComplete(input.headline), href: "/dashboard/profile" },
    { key: "summary", done: isSummaryComplete(input.summary), href: "/dashboard/profile" },
    { key: "skills", done: areSkillsComplete(input.skills), href: "/dashboard/profile" },
    { key: "platformConnected", done: (input.connectionsCount ?? 0) >= 1, href: "/dashboard/platforms" },
    { key: "platformDataFetched", done: (input.platformProfilesCount ?? 0) >= 1, href: "/dashboard/platforms" },
    { key: "adapted", done: (input.adaptationsCount ?? 0) >= 1, href: "/dashboard/platforms" },
  ];

  // Opsiyonel bonus (yüzdeye girmez): avatar + portfolyo yalnız içe aktarmadan gelir.
  const bonus: ProfileBonusItem[] = [
    { key: "avatar", done: !!(input.avatarUrl ?? "").trim(), href: "/dashboard/import" },
    { key: "portfolio", done: (input.portfolioCount ?? 0) >= 1, href: "/dashboard/import" },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.min(100, Math.max(0, Math.round((doneCount / items.length) * 100)));
  const stepPercent = Math.round(100 / items.length);
  return { percent, stage: profileStrengthStage(percent), stepPercent, items, bonus };
}
