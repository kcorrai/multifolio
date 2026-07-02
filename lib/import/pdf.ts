// PDF → düz metin. Dosya baytları bellekte işlenir, hiçbir yere yazılmaz.
// Bozuk/metinsiz PDF hata fırlatmaz; boş string döner (karar route'ta verilir).
import { extractText, getDocumentProxy } from "unpdf";

export async function pdfToText(data: Uint8Array): Promise<string> {
  try {
    const doc = await getDocumentProxy(data);
    const { text } = await extractText(doc, { mergePages: true });
    return (Array.isArray(text) ? text.join(" ") : text).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
