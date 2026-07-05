// Gelen ilan dolandırıcılık ön-filtresi (SAF): job_pool ilan metninde en yaygın
// freelance dolandırıcılık sinyallerini deterministik regex ile arar — AI/kredi YOK.
// lib/health/scan.ts'in AYNASI: o GİDEN metni (kullanıcının yazdığı) circumvention
// için tarar; bu GELEN metni (ilan) dolandırıcılık için tarar. Amaç UYARMAK
// (engellemez). Yüksek kesinlik hedeflenir: küratörlü feed'de yanlış-pozitif
// kullanıcı güvenini aşındırır → her desen "dolandırıcılık bağlamı" sözcüğü şart koşar.

export type JobScamType =
  | "offplatform" // başvuru/iletişim platform dışı mesajlaşmaya yönlendiriliyor
  | "upfront_payment" // önden ücret/depozito/"kit satın al" isteniyor
  | "crypto_payment" // ödeme kripto para ile vaat ediliyor
  | "financial_info"; // banka/kart/kimlik gibi hassas finansal bilgi isteniyor

export interface JobScamFinding {
  type: JobScamType;
  /** İlk eşleşen örnek — UI'da kırpılarak gösterilir. */
  match: string;
}

// Tür başına tek desen. Sıra = UI gösterim sırası. Hepsi "high" kabul edilir
// (dolandırıcılık sinyali); ayrı severity yok — sade tutulur.
const PATTERNS: { type: JobScamType; re: RegExp }[] = [
  {
    // "apply/contact/message on telegram/whatsapp" — bağlam fiili + kanal şart.
    // Ayrıca çıplak wa.me/ ve t.me/ bağlantıları (başvuru davetinin klasik işareti).
    type: "offplatform",
    re: /\b(?:apply|applic\w+|contact|reach(?:\s+out)?|message|text|dm|inbox|interview)\b[^.!?\n]{0,40}\b(?:on|via|through|using|at|by)?\s*(?:whats\s?app|telegram|signal\s?app|wa\.me|t\.me)\b|\b(?:wa\.me|t\.me)\/\S+/i,
  },
  {
    // Önden ödeme dolandırıcılığı: kayıt/işlem/eğitim ücreti, "starter kit",
    // "pay ... upfront/first", "deposit required".
    type: "upfront_payment",
    re: /\b(?:registration|processing|training|application|onboarding|activation|security)\s+fee\b|\bstarter\s+kit\b|\bpay\b[^.!?\n]{0,30}\b(?:upfront|in\s+advance|first|before\s+(?:you|start)|to\s+(?:apply|start|begin))\b|\bdeposit\b[^.!?\n]{0,20}\b(?:required|needed|first)\b|\bbuy\b[^.!?\n]{0,25}\b(?:equipment|software|kit|materials)\b[^.!?\n]{0,15}\b(?:first|yourself|upfront)\b/i,
  },
  {
    // Kripto ile ödeme: ödeme/maaş bağlamı + kripto sözcüğü (web3 iş ilanı değil).
    type: "crypto_payment",
    re: /\b(?:pay(?:ment|s|ed|ing)?|paid|salary|compensation|wage|earn)\b[^.!?\n]{0,30}\b(?:bitcoin|btc|usdt|usdc|ethereum|crypto(?:currency)?)\b|\b(?:bitcoin|usdt|crypto)\b[^.!?\n]{0,15}\b(?:wallet|payment|only)\b/i,
  },
  {
    // Hassas finansal/kimlik bilgisi talebi (meşru ilan bunu açıklamada istemez).
    type: "financial_info",
    re: /\b(?:bank\s+account|credit\s+card|debit\s+card|routing)\s+(?:number|details|info(?:rmation)?)\b|\bsocial\s+security\b|\bssn\b|\b(?:send|share|provide|upload)\b[^.!?\n]{0,25}\b(?:passport|national\s+id|id\s+card|driver'?s?\s+licen[cs]e)\b/i,
  },
];

function trimMatch(s: string): string {
  const clean = s.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
}

/**
 * İlan metnini (başlık + açıklama birleşik) dolandırıcılık sinyalleri için tara.
 * Boş metin → []. Tür başına EN FAZLA bir bulgu (ilk eşleşme), PATTERNS sırasında.
 */
export function scanJobListing(text: string): JobScamFinding[] {
  if (!text) return [];
  const findings: JobScamFinding[] = [];
  for (const { type, re } of PATTERNS) {
    const m = re.exec(text);
    if (m) findings.push({ type, match: trimMatch(m[0]) });
  }
  return findings;
}
