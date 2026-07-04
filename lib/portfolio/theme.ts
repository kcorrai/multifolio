// Portfolyo tema sistemi (SAF): preset + vurgu rengi → CSS değişken haritası.
// Public sayfa (/p/[slug]) ve panel canlı önizleme AYNI tokenları kullanır (DRY).
// Preset renk şeması SABİTtir (ziyaretçinin OS temasını izlemez) — portfolyo
// sahibinin seçtiği görünüm neyse o gösterilir; Noir zaten koyu varyanttır.
import type { CSSProperties } from "react";

export const PORTFOLIO_PRESETS = ["studio", "atelier", "noir"] as const;
export type PortfolioPreset = (typeof PORTFOLIO_PRESETS)[number];

export const PORTFOLIO_ACCENTS = ["blue", "violet", "emerald", "rose", "amber", "cyan"] as const;
export type PortfolioAccent = (typeof PORTFOLIO_ACCENTS)[number];

// Vurgu rengi HEX'leri (WCAG: hepsi beyaz metinle AA sağlar).
export const ACCENT_HEX: Record<PortfolioAccent, string> = {
  blue: "#2563EB",
  violet: "#7C3AED",
  emerald: "#059669",
  rose: "#E11D48",
  amber: "#D97706",
  cyan: "#0891B2",
};

interface PresetBase {
  bg: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
  heading: "sans" | "serif";
  /** Koyu preset (public sayfada görsel/gölge davranışı için). */
  dark: boolean;
}

const PRESET_BASE: Record<PortfolioPreset, PresetBase> = {
  studio: {
    bg: "#FAFAFA", surface: "#FFFFFF", surfaceBorder: "#E4E4E7",
    text: "#09090B", textMuted: "#52525B", heading: "sans", dark: false,
  },
  atelier: {
    bg: "#FBF7F0", surface: "#FFFDF8", surfaceBorder: "#EBE1CF",
    text: "#292524", textMuted: "#78716C", heading: "serif", dark: false,
  },
  noir: {
    bg: "#0A0A0B", surface: "#161618", surfaceBorder: "#2A2A2E",
    text: "#FAFAFA", textMuted: "#A1A1AA", heading: "sans", dark: true,
  },
};

export interface PortfolioThemeInfo {
  vars: CSSProperties;
  dark: boolean;
}

// Preset+accent → root'a uygulanacak CSS değişkenleri + koyu bayrağı.
// Font değişkenleri next/font'tan gelir (--font-archivo/-space/-fraunces);
// heading serif ise Fraunces, değilse Archivo.
export function portfolioTheme(preset: PortfolioPreset, accent: PortfolioAccent): PortfolioThemeInfo {
  const base = PRESET_BASE[preset] ?? PRESET_BASE.studio;
  const accentHex = ACCENT_HEX[accent] ?? ACCENT_HEX.blue;
  const vars = {
    "--pf-bg": base.bg,
    "--pf-surface": base.surface,
    "--pf-border": base.surfaceBorder,
    "--pf-text": base.text,
    "--pf-muted": base.textMuted,
    "--pf-accent": accentHex,
    "--pf-heading-font": base.heading === "serif" ? "var(--font-fraunces)" : "var(--font-archivo)",
    "--pf-body-font": "var(--font-space)",
  } as CSSProperties;
  return { vars, dark: base.dark };
}
