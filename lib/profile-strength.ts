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
  items: ProfileStrengthItem[];
  /** Yüzdeye SAYILMAYAN opsiyonel maddeler (içe aktarmadan gelir). */
  bonus: ProfileBonusItem[];
}

// Çekirdek madde sırası UI'daki checklist sırasıdır (profil alanları → platform döngüsü).
export function computeProfileStrength(input: ProfileStrengthInput): ProfileStrengthResult {
  const headline = (input.headline ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const skills = input.skills ?? [];

  const items: ProfileStrengthItem[] = [
    { key: "headline", done: headline.length >= 20, href: "/dashboard/profile" },
    { key: "summary", done: summary.length >= 80, href: "/dashboard/profile" },
    { key: "skills", done: skills.length >= 5, href: "/dashboard/profile" },
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
  return { percent, items, bonus };
}
