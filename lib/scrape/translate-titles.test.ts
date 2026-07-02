import { describe, it, expect } from "vitest";
import { translateNewTitles, type TitleTranslator } from "./translate-titles";

// Zincirlenebilir Supabase admin mock'u: select sonucu sabit, update çağrıları yakalanır.
function mockAdmin(rows: { id: string; title: string }[], updateError: unknown = null) {
  const updates: { id: string; patch: Record<string, unknown> }[] = [];
  const admin = {
    from() {
      return {
        select() {
          return {
            is() {
              return {
                order() {
                  return { limit: () => Promise.resolve({ data: rows, error: null }) };
                },
              };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(_col: string, id: string) {
              updates.push({ id, patch });
              return Promise.resolve({ error: updateError });
            },
          };
        },
      };
    },
  };
  return { admin, updates };
}

const okTranslator: TitleTranslator = async (jobs) => ({
  items: jobs.map((j) => ({ id: j.id, lang: "de", title_en: `EN ${j.title}`, title_tr: `TR ${j.title}` })),
});

describe("translateNewTitles", () => {
  it("çevrilmemiş satırları çevirip job_pool'a yazar", async () => {
    const { admin, updates } = mockAdmin([{ id: "a", title: "Verkäufer" }, { id: "b", title: "Koch" }]);
    const result = await translateNewTitles(admin as never, okTranslator);

    expect(result).toMatchObject({ scanned: 2, translated: 2, error: null });
    expect(updates).toHaveLength(2);
    expect(updates[0]).toEqual({ id: "a", patch: { lang: "de", title_en: "EN Verkäufer", title_tr: "TR Verkäufer" } });
  });

  it("modelin uydurduğu (gönderilmeyen) id'leri atlar", async () => {
    const bogus: TitleTranslator = async () => ({
      items: [{ id: "hayalet", lang: "de", title_en: "X", title_tr: "Y" }],
    });
    const { admin, updates } = mockAdmin([{ id: "a", title: "Verkäufer" }]);
    const result = await translateNewTitles(admin as never, bogus);

    expect(result).toMatchObject({ scanned: 1, translated: 0, error: null });
    expect(updates).toHaveLength(0);
  });

  it("çevirmen patlarsa hata döner ama throw etmez (scrape sonucu korunur)", async () => {
    const boom: TitleTranslator = async () => { throw new Error("AI down"); };
    const { admin } = mockAdmin([{ id: "a", title: "Verkäufer" }]);
    const result = await translateNewTitles(admin as never, boom);

    expect(result.error).toContain("AI down");
    expect(result.translated).toBe(0);
  });

  it("çevrilecek satır yoksa AI çağrılmadan boş özet döner", async () => {
    let called = false;
    const spy: TitleTranslator = async (jobs) => { called = true; return okTranslator(jobs); };
    const { admin } = mockAdmin([]);
    const result = await translateNewTitles(admin as never, spy);

    expect(result).toMatchObject({ scanned: 0, translated: 0, error: null });
    expect(called).toBe(false);
  });
});
