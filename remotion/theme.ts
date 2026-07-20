/**
 * Landing showcase videosunun KENDİ marka tokenları.
 *
 * Bilinçli olarak globals.css'ten okunmaz (CSS değişkeni YOK): kompozisyon hem
 * tarayıcıdaki @remotion/player'da hem de ileride MP4 export'unda (sayfa CSS'i
 * olmayan ortam) birebir aynı render etmeli. Renkler landing'in literal
 * paletinden alınmıştır (app/page.tsx'teki #00F0FF / #12141C / #94A3B8 ailesi).
 */

export interface Palette {
  /** Pencere dışı zemin (video kenarı). */
  canvas: string;
  /** Uygulama penceresi gövdesi. */
  surface: string;
  /** Pencere çubuğu / sidebar gibi hafif yükseltilmiş yüzeyler. */
  raised: string;
  /** Kart yüzeyi. */
  card: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  /** İmza vurgu (dolgular, halkalar, parlamalar). */
  accent: string;
  /** Vurgunun metin üzerinde okunabilir tonu (açık temada koyulaşır). */
  accentText: string;
  accentSoft: string;
  success: string;
  warning: string;
  /** Pencere gölgesi. */
  shadow: string;
}

export const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    canvas: "#0B0D14",
    surface: "#12141C",
    raised: "#161923",
    card: "#1A1E29",
    border: "rgba(255,255,255,0.09)",
    text: "#F1F5F9",
    textMuted: "#94A3B8",
    textSubtle: "rgba(255,255,255,0.38)",
    accent: "#00F0FF",
    accentText: "#00F0FF",
    accentSoft: "rgba(0,240,255,0.12)",
    success: "#34D399",
    warning: "#FBBF24",
    shadow: "0 30px 80px rgba(0,0,0,0.55)",
  },
  light: {
    canvas: "#EEF2F7",
    surface: "#FFFFFF",
    raised: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    text: "#0F172A",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    accent: "#00C8DB",
    // Beyaz üstünde #00F0FF okunmaz → koyulaştırılmış cyan (WCAG AA gövde metni).
    accentText: "#0E7C8C",
    accentSoft: "rgba(0,200,219,0.14)",
    success: "#059669",
    warning: "#D97706",
    shadow: "0 30px 80px rgba(15,23,42,0.14)",
  },
};

/** Sistem font yığını — Remotion'da font yüklemesi beklemeden anında çizer. */
export const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif';

/** Video yapılandırması — 16:9, 30fps, 24 sn (sonsuz döngü). */
export const VIDEO = {
  width: 1280,
  height: 720,
  fps: 30,
  durationInFrames: 720,
} as const;

/** Platform rozeti renkleri (feed satırlarındaki kaynak etiketi). */
export const PLATFORM_TONES: Record<string, string> = {
  Upwork: "#14A800",
  LinkedIn: "#0A66C2",
  Fiverr: "#1DBF73",
};
