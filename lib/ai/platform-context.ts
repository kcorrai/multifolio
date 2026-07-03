// Platformdan çekilmiş kullanıcı profil verisini (platform_profiles) AI
// prompt'una ekleyen SAF blok üretici (server-only değil — test edilebilir).
// Uyarlama ve teklif üretiminde çekirdek profile ek bağlam olarak verilir:
// model kullanıcının o platformdaki GERÇEK diliyle/becerileriyle tutarlı kalır.

export interface PlatformProfileContext {
  headline: string;
  summary: string;
  skills: string[];
}

// Prompt şişmesin: platform özeti uzunsa kırpılır.
const SUMMARY_MAX = 800;

export function buildPlatformProfileBlock(pp: PlatformProfileContext | null | undefined): string {
  if (!pp) return "";
  const headline = pp.headline.trim();
  const summary = pp.summary.trim();
  const skills = pp.skills.filter((s) => s.trim().length > 0);
  if (!headline && !summary && skills.length === 0) return "";

  const lines = [
    "",
    "Kullanıcının bu platformdaki MEVCUT (gerçek) profili — tona ve iddialara tutarlı kal, üzerine inşa et, çelişme:",
  ];
  if (headline) lines.push(`- Mevcut başlık: ${headline}`);
  if (summary) {
    const cut = summary.length > SUMMARY_MAX ? `${summary.slice(0, SUMMARY_MAX)}…` : summary;
    lines.push(`- Mevcut özet: ${cut}`);
  }
  if (skills.length > 0) lines.push(`- Platformda listelediği beceriler: ${skills.join(", ")}`);
  return lines.join("\n");
}
