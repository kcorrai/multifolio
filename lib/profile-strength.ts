// Saf profil gücü hesabı: 8 eşit ağırlıklı madde → yüzde + eksik-madde
// checklist'i. Server component (dashboard) hesaplar, UI checklist'i render eder.
// Upwork'ün kendi verisi: %100 tam profil = 4.5x işe alınma — eşikler bu
// "işe yarar profil" çıtasını hedefler, keyfi doldurmayı değil.

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
  | "avatar"
  | "portfolio"
  | "platformConnected"
  | "platformDataFetched"
  | "adapted";

export interface ProfileStrengthItem {
  key: ProfileStrengthKey;
  done: boolean;
  /** Madde eksikse kullanıcının gideceği sayfa. */
  href: string;
}

export interface ProfileStrengthResult {
  percent: number;
  items: ProfileStrengthItem[];
}

// Madde sırası UI'daki checklist sırasıdır (profil alanları → platform adımları).
export function computeProfileStrength(input: ProfileStrengthInput): ProfileStrengthResult {
  const headline = (input.headline ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const skills = input.skills ?? [];

  const items: ProfileStrengthItem[] = [
    { key: "headline", done: headline.length >= 20, href: "/dashboard/profile" },
    { key: "summary", done: summary.length >= 80, href: "/dashboard/profile" },
    { key: "skills", done: skills.length >= 5, href: "/dashboard/profile" },
    // Avatar + portfolyo yalnız içe aktarmadan gelir (manuel yükleme yok).
    { key: "avatar", done: !!(input.avatarUrl ?? "").trim(), href: "/dashboard/import" },
    { key: "portfolio", done: (input.portfolioCount ?? 0) >= 1, href: "/dashboard/import" },
    { key: "platformConnected", done: (input.connectionsCount ?? 0) >= 1, href: "/dashboard/platforms" },
    { key: "platformDataFetched", done: (input.platformProfilesCount ?? 0) >= 1, href: "/dashboard/platforms" },
    { key: "adapted", done: (input.adaptationsCount ?? 0) >= 1, href: "/dashboard/platforms" },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.min(100, Math.max(0, Math.round((doneCount / items.length) * 100)));
  return { percent, items };
}
