// Scrape sonrası başlık çevirisi: lang IS NULL (henüz çevrilmemiş) pool satırlarını
// chunk'lar halinde AI'a verir, dönen dil tespiti + EN/TR başlıkları job_pool'a yazar.
// run.ts gibi service-role client'ı ve çevirmeni PARAMETRE alır (server-only import
// etmez) — saf/test-edilebilir kalır. Hata içeride yakalanır: çeviri patlasa da
// scrape sonucu döner (kısmi ilerleme korunur, kalanı sonraki cron koşusunda biter).
import type { SupabaseClient } from "@supabase/supabase-js";

export interface TitleTranslator {
  (jobs: { id: string; title: string }[]): Promise<{
    items: { id: string; lang: string; title_en: string; title_tr: string }[];
  }>;
}

export interface TranslateTitlesResult {
  scanned: number;
  translated: number;
  error: string | null;
  ms: number;
}

// Koşu başına tavan (cron periyodik — kalan birikmişler sonraki koşularda erir).
const RUN_LIMIT = 200;
// AI çağrısı başına başlık sayısı (batch küçük kalsın ki tek hata az iş kaybettirsin).
const CHUNK_SIZE = 40;

export async function translateNewTitles(
  admin: SupabaseClient,
  translate: TitleTranslator,
): Promise<TranslateTitlesResult> {
  const started = Date.now();
  let scanned = 0;
  let translated = 0;
  try {
    const { data, error } = await admin
      .from("job_pool")
      .select("id, title")
      .is("lang", null)
      .order("created_at", { ascending: false })
      .limit(RUN_LIMIT);
    if (error) throw error;

    const rows = (data ?? []) as { id: string; title: string }[];
    scanned = rows.length;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { items } = await translate(chunk);
      const ids = new Set(chunk.map((r) => r.id));
      for (const item of items) {
        if (!ids.has(item.id)) continue; // model gönderilmeyen bir id döndürdüyse atla
        const { error: upErr } = await admin
          .from("job_pool")
          .update({ lang: item.lang, title_en: item.title_en, title_tr: item.title_tr })
          .eq("id", item.id);
        if (upErr) throw upErr;
        translated++;
      }
    }

    return { scanned, translated, error: null, ms: Date.now() - started };
  } catch (err) {
    return {
      scanned,
      translated,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    };
  }
}
