/**
 * Showcase videosunun SAF zamanlama katmanı — DOM/Remotion bağımlılığı YOK, bu yüzden
 * vitest'lenebilir (scenes.test.ts). Kompozisyon (ShowcaseVideo.tsx) yalnız bu tabloyu
 * tüketir; sahne sürelerini ayarlamak = burada birkaç sayı değiştirmek.
 *
 * Zaman çizelgesi: 30fps × 720 kare = 24 sn, sonsuz döngü.
 */

export type SceneId = "profile" | "feed" | "proposal" | "portfolio" | "cv";

export interface Scene {
  id: SceneId;
  /** Sahnenin ekranda olduğu kare aralığı [start, end). */
  start: number;
  end: number;
  /** Pencere URL çubuğunda gösterilen yol. */
  url: string;
}

/**
 * Sahneler bitişik: her biri bir öncekinin bittiği karede başlar (boşluk/örtüşme yok).
 * Giriş/çıkış yumuşatması ayrı (bkz. TRANSITION) — pencereler mantıksal sahne sınırıdır.
 */
export const SCENES: readonly Scene[] = [
  { id: "profile",   start: 0,   end: 120, url: "multifolio.app/dashboard/profile" },
  { id: "feed",      start: 120, end: 270, url: "multifolio.app/dashboard/jobs" },
  { id: "proposal",  start: 270, end: 420, url: "multifolio.app/dashboard/jobs" },
  { id: "portfolio", start: 420, end: 570, url: "multifolio.app/p/ahmet-yilmaz" },
  { id: "cv",        start: 570, end: 720, url: "multifolio.app/dashboard/cv" },
] as const;

/** Sahne giriş/çıkış yumuşatma süresi (kare). */
export const TRANSITION = 14;

/** Verilen karede görünen sahnenin indeksi (sınırların dışı en yakına kırpılır). */
export function activeSceneIndex(frame: number): number {
  for (let i = 0; i < SCENES.length; i++) {
    if (frame < SCENES[i]!.end) return i;
  }
  return SCENES.length - 1;
}

/** Verilen karede görünen sahne. */
export function activeScene(frame: number): Scene {
  return SCENES[activeSceneIndex(frame)]!;
}

/**
 * İlk sahnenin giriş süresi (kare). Diğerlerinden kısa: döngü dikişinde (719 → 0)
 * uzun bir açılma "video baştan başladı" hissi verir. SIFIR OLAMAZ — Remotion'ın
 * `interpolate`'i KESİN ARTAN girdi aralığı ister, [0,0,…] hata fırlatır.
 */
const FIRST_ENTER = 2;

/**
 * Bir sahnenin fade/rise için interpolate girdisi:
 * [girişBaşı, girişSonu, çıkışBaşı, çıkışSonu] — daima kesin artan.
 */
export function sceneWindow(scene: Scene): [number, number, number, number] {
  const enter = scene.start === 0 ? FIRST_ENTER : TRANSITION;
  return [scene.start, scene.start + enter, scene.end - TRANSITION, scene.end];
}
