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
// NOT: anahtarlar SABİT — yayınlanmış portfolyoların jsonb içeriğinde saklanıyor.
// Değerler 2026-08 Solar Pop geçişinde bir tık kısıldı: müşteri sayfasında renk
// bağırmaz, işin kendisi bağırır.
export const ACCENT_HEX: Record<PortfolioAccent, string> = {
  blue: "#4B5BD7",
  violet: "#4A5A73",
  emerald: "#4A7A3C",
  rose: "#B2445F",
  amber: "#B5771C",
  cyan: "#0F8A85",
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
  /* ── Yapısal eksenler ────────────────────────────────────────────────
     Preset'ler yalnız RENKTE değil, RİTİMDE de ayrışır: ölçü genişliği,
     bölüm aralığı, başlık ölçeği, köşe yarıçapı, görsel oranı, galeri kolonu
     ve hero hizası. "Sadece vurgu rengi değişiyor" hissi böyle kırılır. */
  maxWidth: number;
  sectionGap: number;
  h1: string;
  h2: string;
  body: string;
  lead: string;
  radius: number;
  imageRatio: string;
  galleryColumns: number;
  heroColumns: string;
  heroAlign: "left" | "center";
  eyebrowCase: "uppercase" | "none";
  eyebrowTracking: string;
  avatarRadius: string;
}

const PRESET_BASE: Record<PortfolioPreset, PresetBase> = {
  // Studio: nötr, ızgaralı, ajans portfolyosu ritmi.
  studio: {
    bg: "#F7F7F5", surface: "#FFFFFF", surfaceBorder: "#E3E3DE",
    text: "#14161A", textMuted: "#5C6172", heading: "sans", dark: false,
    maxWidth: 1080, sectionGap: 72,
    h1: "clamp(38px,5vw,62px)", h2: "24px", body: "16px", lead: "19px",
    radius: 14, imageRatio: "4 / 3", galleryColumns: 3,
    heroColumns: "1.25fr .75fr", heroAlign: "left",
    eyebrowCase: "uppercase", eyebrowTracking: "0.14em", avatarRadius: "18px",
  },
  // Atelier: tek dar kolon, ortalı, serif başlık — dergi/monograf ritmi.
  atelier: {
    bg: "#FBF7F0", surface: "#FFFDF9", surfaceBorder: "#E8DFD0",
    text: "#231C14", textMuted: "#6B5B47", heading: "serif", dark: false,
    maxWidth: 760, sectionGap: 104,
    h1: "clamp(42px,6vw,76px)", h2: "30px", body: "17px", lead: "21px",
    radius: 3, imageRatio: "3 / 4", galleryColumns: 2,
    heroColumns: "1fr", heroAlign: "center",
    eyebrowCase: "none", eyebrowTracking: "0.02em", avatarRadius: "50%",
  },
  // Noir: geniş, sıkı, koyu — ürün/stüdyo vitrini ritmi.
  noir: {
    bg: "#0C0D10", surface: "#15171C", surfaceBorder: "#242830",
    text: "#F2F3F5", textMuted: "#A8AEBA", heading: "sans", dark: true,
    maxWidth: 1140, sectionGap: 56,
    h1: "clamp(34px,4.4vw,54px)", h2: "21px", body: "15px", lead: "17px",
    radius: 22, imageRatio: "16 / 10", galleryColumns: 2,
    heroColumns: ".8fr 1.2fr", heroAlign: "left",
    eyebrowCase: "uppercase", eyebrowTracking: "0.18em", avatarRadius: "22px",
  },
};

export interface PortfolioThemeInfo {
  vars: CSSProperties;
  dark: boolean;
  /** Düzen kararları (CSS değişkeniyle ifade edilemeyen yapısal seçimler). */
  layout: {
    maxWidth: number;
    sectionGap: number;
    galleryColumns: number;
    heroColumns: string;
    heroAlign: "left" | "center";
    imageRatio: string;
    radius: number;
  };
}

// Preset+accent → root'a uygulanacak CSS değişkenleri + koyu bayrağı + düzen.
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
    "--pf-h1": base.h1,
    "--pf-h2": base.h2,
    "--pf-body-size": base.body,
    "--pf-lead": base.lead,
    "--pf-radius": `${base.radius}px`,
    "--pf-radius-sm": `${Math.min(base.radius, 12)}px`,
    "--pf-max": `${base.maxWidth}px`,
    "--pf-gap": `${base.sectionGap}px`,
    "--pf-ratio": base.imageRatio,
    "--pf-eyebrow-case": base.eyebrowCase,
    "--pf-eyebrow-track": base.eyebrowTracking,
    "--pf-avatar-radius": base.avatarRadius,
  } as CSSProperties;

  return {
    vars,
    dark: base.dark,
    layout: {
      maxWidth: base.maxWidth,
      sectionGap: base.sectionGap,
      galleryColumns: base.galleryColumns,
      heroColumns: base.heroColumns,
      heroAlign: base.heroAlign,
      imageRatio: base.imageRatio,
      radius: base.radius,
    },
  };
}
