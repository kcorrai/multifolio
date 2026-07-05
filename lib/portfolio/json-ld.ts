// Portfolyo public sayfası için schema.org Person JSON-LD (SAF): arama motorları +
// paylaşım önizlemeleri zengin kişi kartı gösterir (SEO + güven). Çıktı doğrudan
// <script type="application/ld+json"> içine gömülür → '<' kaçırılır ki bio içindeki
// bir "</script>" script'i erken kapatmasın (XSS/kırılma önlemi).

export interface PersonJsonLdInput {
  /** Kişi/kimlik adı (portfolyo başlığı). */
  name: string;
  description: string;
  skills: string[];
  avatarUrl: string | null;
  /** Portfolyonun mutlak URL'i. */
  url: string;
}

export function buildPersonJsonLd(input: PersonJsonLdInput): string {
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    description: input.description.slice(0, 300),
    url: input.url,
  };
  if (input.avatarUrl) obj.image = input.avatarUrl;
  if (input.skills.length > 0) obj.knowsAbout = input.skills;
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
