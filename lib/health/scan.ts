// Hesap sağlığı taraması (SAF): üretilen metinde platform kural ihlali sinyali arar.
// lib/analyze/score.ts + lib/feed/relevance.ts deseni — AI/kredi YOK, deterministik.
// Client da import eder (uyarı rozetleri). Amaç: pazaryeri platformlarında en sık
// hesap kapatma sebebi olan "platform dışına çıkarma" (circumvention) sinyallerini
// yakalayıp kullanıcıyı UYARMAK (engellemez — kullanıcı metni yine kopyalayabilir).
import type { PlatformId } from "@/lib/ai/platforms";

export type HealthFindingType =
  | "email" // e-posta adresi
  | "phone" // telefon numarası
  | "messaging" // whatsapp/telegram/skype
  | "payment" // platform dışı ödeme (paypal/iban/havale)
  | "external_link"; // dış bağlantı

export type HealthSeverity = "high" | "medium";

export interface HealthFinding {
  type: HealthFindingType;
  severity: HealthSeverity;
  /** İlk eşleşen örnek metin — UI'da "…" ile kırpılarak gösterilir. */
  match: string;
}

// LinkedIn = kişisel networking profili: iletişim bilgisi, dış link ve web sitesi
// oraya konur, normaldir → TARANMAZ. Diğer dördü pazaryeri: müşteriyi platform
// dışına çıkarmak (iletişim/ödeme paylaşımı) ToS ihlali ve ban sebebidir.
const SCANNED: Record<PlatformId, boolean> = {
  linkedin: false,
  upwork: true,
  fiverr: true,
  // Komisyon alan pazaryerleri: müşteriyi platform dışına çıkarmak ToS ihlali/ban.
  freelancer: true,
  peopleperhour: true,
  "99designs": true,
  guru: true,
  // Contra = %0 komisyon, doğrudan müşteri ilişkisi teşvik edilir → iletişim
  // paylaşımı ban sebebi değil; LinkedIn gibi TARANMAZ.
  contra: false,
};

// Tür başına tek desen (ya da IBAN gibi ek desen). Sıra = UI gösterim sırası.
// Yüksek kesinlik hedeflenir: yanlış-pozitif kullanıcı güvenini aşındırır.
const PATTERNS: { type: HealthFindingType; severity: HealthSeverity; re: RegExp }[] = [
  {
    type: "email",
    severity: "high",
    re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  },
  {
    type: "messaging",
    severity: "high",
    re: /\b(whats\s?app|telegram|skype|viber|wa\.me|t\.me)\b/i,
  },
  {
    type: "payment",
    severity: "high",
    // Ödeme kanalı adları + platform-dışı ödeme kalıpları + IBAN (TR + genel).
    re: /(\bpaypal\b|\bpapara\b|\bwise\b|western\s?union|money\s?gram|\biban\b|banka\s?havale|havale\s?\/?\s?eft|off[-\s]?platform|platform\s?d[ıi]ş[ıi]|d[ıi]şar[ıi]da\s?[öo]de|pay\s?(me\s?)?directly|directly\s?to\s?me|TR\d{2}(?:\s?\d{4}){4}\s?\d{2})/i,
  },
  {
    type: "phone",
    severity: "high",
    // TR mobil (05xx / +90 5xx) veya açık uluslararası (+ önekli) numara.
    // Bütçe/rakam dizilerini elemek için ya 5xx mobil kalıbı ya + öneki şart.
    re: /(?:\+?90[\s.\-]?)?0?\(?5\d{2}\)?[\s.\-]?\d{3}[\s.\-]?\d{2}[\s.\-]?\d{2}\b|\+\d{1,3}[\s.\-]?\d{2,4}[\s.\-]?\d{3}[\s.\-]?\d{2,4}/,
  },
  {
    type: "external_link",
    severity: "medium",
    re: /(https?:\/\/|www\.)[^\s)]+/i,
  },
];

// Gösterim için eşleşmeyi kırp (uzun URL/metinlerde paneli taşırmasın).
function trimMatch(s: string): string {
  const clean = s.trim();
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
}

/**
 * Metni platforma göre tara. Taranmayan platform (LinkedIn) veya boş metin → [].
 * Tür başına EN FAZLA bir bulgu döner (ilk eşleşme), PATTERNS sırasında.
 */
export function scanContent(text: string, platform: PlatformId): HealthFinding[] {
  if (!SCANNED[platform] || !text) return [];
  const findings: HealthFinding[] = [];
  for (const { type, severity, re } of PATTERNS) {
    const m = re.exec(text);
    if (m) findings.push({ type, severity, match: trimMatch(m[0]) });
  }
  return findings;
}
