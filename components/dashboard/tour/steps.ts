// Onboarding turu — SAF adım tanımları (Clash Royale tarzı spotlight akışı).
// Sıralı: karşılama → hesap bağla → profil + AI → uyarla → işler → CV → portfolyo → bitiş.
// Metin i18n'de (tour.steps.<id>.title/body). Overlay bu diziyi tüketir.

export type TourPlacement = "center" | "auto";
// "click": yalnız parlak hedefe tıklayınca ilerler (nav linkleri — zorunlu tap).
// "next":  açıklama adımı; "İleri" ile ilerler.
export type TourAdvance = "click" | "next";

export interface TourStep {
  /** Kararlı id + i18n anahtarı (tour.steps.<id>). */
  id: string;
  /** Adımın çalıştığı route; overlay pathname eşleşene kadar hedefi aramaz. */
  path?: string;
  /** Parlatılacak elemanın data-tour id'si; yoksa = ekran ortası kart. */
  target?: string;
  placement: TourPlacement;
  advance: TourAdvance;
  /** true → tooltip'te "Bu adımı atla" (hesap bağlama gibi zorunlu olmayan adım). */
  optional?: boolean;
}

// Not: nav-tıklama adımları ve karşılama/bitiş kartlarında `path` YOK — nav her dashboard
// sayfasında görünür ve profilsiz kullanıcı /dashboard yerine /dashboard/import'ta başlar,
// dolayısıyla sabit path'e bağlanmak turu kilitler. İçerik adımlarında `path` var: overlay
// o sayfaya gidilene kadar hedefi aramaz (navigasyon beklemesi).
export const TOUR_STEPS: TourStep[] = [
  { id: "welcome",                                         placement: "center", advance: "next" },
  { id: "connectNav",                                      target: "nav-platforms",       placement: "auto", advance: "click" },
  { id: "connectCard",       path: "/dashboard/platforms", target: "platform-card",       placement: "auto", advance: "next", optional: true },
  { id: "adapt",             path: "/dashboard/platforms", target: "adapt-all",           placement: "auto", advance: "next" },
  { id: "profileNav",                                      target: "nav-profile",         placement: "auto", advance: "click" },
  { id: "profileAi",         path: "/dashboard/profile",   target: "profile-ai",          placement: "auto", advance: "next" },
  { id: "jobsNav",                                         target: "nav-jobs",            placement: "auto", advance: "click" },
  { id: "jobsFeed",          path: "/dashboard/jobs",      target: "jobs-feed",           placement: "auto", advance: "next" },
  { id: "cvNav",                                           target: "nav-cv",              placement: "auto", advance: "click" },
  { id: "cvGenerate",        path: "/dashboard/cv",        target: "cv-generate",         placement: "auto", advance: "next" },
  { id: "portfolioNav",                                    target: "nav-portfolio",       placement: "auto", advance: "click" },
  { id: "portfolioGenerate", path: "/dashboard/portfolio", target: "portfolio-generate",  placement: "auto", advance: "next" },
  { id: "finish",                                          placement: "center", advance: "next" },
];

export const TOUR_TOTAL = TOUR_STEPS.length;
