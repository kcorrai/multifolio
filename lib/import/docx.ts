// DOCX → düz metin. Dosya baytları bellekte işlenir, hiçbir yere yazılmaz (pdf.ts deseni).
// Bozuk/desteklenmeyen dosya hata fırlatmaz; boş string döner (karar route'ta verilir).
// Not: yalnız .docx (Open XML). Eski binary .doc mammoth tarafından desteklenmez → boş döner.
import mammoth from "mammoth";

export async function docxToText(data: Buffer): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer: data });
    return (value ?? "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
