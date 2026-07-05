// Teklif "ses hafızası" (SAF): kullanıcının geçmiş tekliflerinden örnekleri AI prompt'una
// üslup referansı olarak enjekte eder → üretilen teklif kullanıcının SESİNE benzer (jenerik
// AI'dan farklılaşma; Upwex deseni). İçerik KOPYALANMAZ, yalnız ton/üslup eşlenir.
// Örnek yoksa boş döner (davranış değişmez). AI/kredi yok; proposal.ts kullanır.

const MAX_EXAMPLES = 3;
const MAX_CHARS = 700;

/**
 * Geçmiş teklif örneklerinden üslup direktif bloğu. Boş/whitespace örnekler elenir,
 * en fazla MAX_EXAMPLES alınır, her biri MAX_CHARS'a kırpılır. Örnek yoksa "".
 */
export function buildVoiceBlock(examples: (string | null | undefined)[]): string {
  const cleaned = examples
    .map((e) => (e ?? "").trim())
    .filter((e) => e.length > 0)
    .slice(0, MAX_EXAMPLES)
    .map((e) => (e.length > MAX_CHARS ? e.slice(0, MAX_CHARS) + "…" : e));

  if (cleaned.length === 0) return "";

  const blocks = cleaned.map((e, i) => `Örnek ${i + 1}:\n"""${e}"""`).join("\n\n");
  return [
    "",
    "Kullanıcının geçmiş tekliflerinden örnekler — YAZIM ÜSLUBUNU ve SESİNİ eşle " +
      "(ton, cümle uzunluğu, resmiyet, selamlama/kapanış tarzı). İçeriği veya özel " +
      "detayları KOPYALAMA; bu ilana özgü yeni bir teklif yaz:",
    blocks,
  ].join("\n");
}
