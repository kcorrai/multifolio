import { describe, it, expect } from "vitest";
import { PLATFORMS, PLATFORM_IDS, platformIdSchema, type PlatformId } from "./platforms";

/**
 * `profileImport` UI'da üç farklı dal sürüyor (çek butonu / uzantı yönlendirmesi /
 * "henüz yok" notu). Yanlış işaretlenirse kullanıcıya çalışmayan bir buton ya da
 * yanlış bilgi gösterilir — bu yüzden beklenen set teste çakılı.
 */
describe("PLATFORMS registry — profileImport", () => {
  // 2026-07-20 canlı ölçüm (gerçek public profil sayfalarına istek):
  //   linkedin/contra/guru → ld+json Person, düz fetch 200 → yapılandırılmış
  //   freelancer/peopleperhour → ld+json yok ama sayfa 200 + metin dolu → metin→AI
  //   upwork/fiverr/99designs → bot duvarı (99designs düz fetch'te 202 + boş kabuk)
  const EXPECTED: Record<PlatformId, "server" | "extension" | "none"> = {
    linkedin: "server",
    contra: "server",
    guru: "server",
    freelancer: "server",
    peopleperhour: "server",
    upwork: "extension",
    fiverr: "extension",
    "99designs": "extension",
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

  it("sunucudan çekilebilen set: linkedin/contra/guru/freelancer/peopleperhour", () => {
    const server = platformIdSchema.options.filter((id) => PLATFORMS[id].profileImport === "server");
    expect(server.sort()).toEqual(["contra", "freelancer", "guru", "linkedin", "peopleperhour"]);
  });

  it("uzantı gerektiren set (bot duvarlı): upwork/fiverr/99designs", () => {
    const ext = platformIdSchema.options.filter((id) => PLATFORMS[id].profileImport === "extension");
    expect(ext.sort()).toEqual(["99designs", "fiverr", "upwork"]);
  });

  it("artık profil çekimi olmayan platform kalmadı", () => {
    const none = platformIdSchema.options.filter((id) => PLATFORMS[id].profileImport === "none");
    expect(none).toEqual([]);
  });
});
