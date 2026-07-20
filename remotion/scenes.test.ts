import { describe, it, expect } from "vitest";
import { SCENES, TRANSITION, activeScene, activeSceneIndex, sceneWindow } from "./scenes";
import { VIDEO } from "./theme";

describe("showcase video sahne zamanlaması", () => {
  it("sahneler 0'dan video sonuna kadar boşluksuz/örtüşmesiz kapsar", () => {
    expect(SCENES[0]!.start).toBe(0);
    expect(SCENES.at(-1)!.end).toBe(VIDEO.durationInFrames);
    for (let i = 1; i < SCENES.length; i++) {
      expect(SCENES[i]!.start).toBe(SCENES[i - 1]!.end);
    }
  });

  it("her sahne geçiş süresinden belirgin uzun (giriş+çıkış sığar)", () => {
    for (const s of SCENES) {
      expect(s.end - s.start).toBeGreaterThan(TRANSITION * 3);
    }
  });

  it("activeSceneIndex sahne sınırlarını doğru ayırır", () => {
    for (let i = 0; i < SCENES.length; i++) {
      const s = SCENES[i]!;
      expect(activeSceneIndex(s.start)).toBe(i);
      expect(activeSceneIndex(s.end - 1)).toBe(i);
    }
  });

  it("sınır dışı kareler en yakın sahneye kırpılır", () => {
    expect(activeSceneIndex(-30)).toBe(0);
    expect(activeSceneIndex(VIDEO.durationInFrames)).toBe(SCENES.length - 1);
    expect(activeSceneIndex(99999)).toBe(SCENES.length - 1);
  });

  it("her karede tam olarak bir sahne aktif", () => {
    for (let f = 0; f < VIDEO.durationInFrames; f++) {
      const matches = SCENES.filter((s) => f >= s.start && f < s.end);
      expect(matches).toHaveLength(1);
      expect(activeScene(f).id).toBe(matches[0]!.id);
    }
  });

  // Remotion `interpolate` KESİN ARTAN aralık ister; eşitlik çalışma anında hata fırlatır
  // (bu testin ilk hali >= kullanıyordu ve [0,0,…] hatasını kaçırmıştı).
  it("sceneWindow KESİN artan dört nokta verir", () => {
    for (const s of SCENES) {
      const w = sceneWindow(s);
      for (let i = 1; i < w.length; i++) {
        expect(w[i]!).toBeGreaterThan(w[i - 1]!);
      }
      expect(w[0]).toBe(s.start);
      expect(w[3]).toBe(s.end);
    }
  });

  it("ilk sahne döngü dikişi için kısa açılır, diğerleri tam geçişle", () => {
    const [start, enterEnd] = sceneWindow(SCENES[0]!);
    expect(start).toBe(0);
    expect(enterEnd - start).toBeLessThan(TRANSITION);
    const second = sceneWindow(SCENES[1]!);
    expect(second[1] - second[0]).toBe(TRANSITION);
  });

  it("URL'ler anlatıyı takip eder (profil → işler → portfolyo → cv)", () => {
    expect(activeScene(10).url).toContain("/dashboard/profile");
    expect(activeScene(200).url).toContain("/dashboard/jobs");
    expect(activeScene(500).url).toContain("/p/");
    expect(activeScene(700).url).toContain("/dashboard/cv");
  });
});
