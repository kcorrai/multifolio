import { describe, it, expect } from "vitest";
import { PLATFORMS, PLATFORM_IDS, platformIdSchema, type PlatformId } from "./platforms";

/**
 * `profileImport` UI'da üç farklı dal sürüyor (çek butonu / uzantı yönlendirmesi /
 * "henüz yok" notu). Yanlış işaretlenirse kullanıcıya çalışmayan bir buton ya da
 * yanlış bilgi gösterilir — bu yüzden beklenen set teste çakılı.
 */
describe("PLATFORMS registry — profileImport", () => {
  // Gerçeklik: yalnız LinkedIn'in sunucu-taraflı çekimi var (lib/import/linkedin.ts);
  // Upwork+Fiverr uzantı manifest'inde tanımlı; kalan 5'i HENÜZ yazılmadı.
  const EXPECTED: Record<PlatformId, "server" | "extension" | "none"> = {
    linkedin: "server",
    upwork: "extension",
    fiverr: "extension",
    freelancer: "none",
    contra: "none",
    peopleperhour: "none",
    "99designs": "none",
    guru: "none",
  };

  it("her platform id'si için giriş var ve id kendiyle tutarlı", () => {
    for (const id of platformIdSchema.options) {
      expect(PLATFORMS[id]).toBeDefined();
      expect(PLATFORMS[id].id).toBe(id);
      expect(PLATFORMS[id].label.length).toBeGreaterThan(0);
    }
    expect(PLATFORM_IDS.length).toBe(platformIdSchema.options.length);
  });

  it("profileImport beklenen değerlerde (yeni platform eklenince bilinçli güncellensin)", () => {
    for (const id of platformIdSchema.options) {
      expect(PLATFORMS[id].profileImport, `${id} profileImport`).toBe(EXPECTED[id]);
    }
  });

  it("sunucudan çekilebilen platform seti tam olarak {linkedin}", () => {
    const server = platformIdSchema.options.filter((id) => PLATFORMS[id].profileImport === "server");
    expect(server).toEqual(["linkedin"]);
  });

  it("uzantı gerektiren set tam olarak {upwork, fiverr}", () => {
    const ext = platformIdSchema.options.filter((id) => PLATFORMS[id].profileImport === "extension");
    expect(ext.sort()).toEqual(["fiverr", "upwork"]);
  });
});
