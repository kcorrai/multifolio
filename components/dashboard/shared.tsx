import {
  User, Layers, Globe, Briefcase, Target, LayoutDashboard, Languages, BellRing, Wand2,
  FileText, Download, RefreshCw, Gauge, Sparkles, MessageSquare, Handshake, Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JobStatus, JobMatchResult } from "@/lib/validation/schemas/job";
import type { PlatformId } from "@/lib/ai/platforms";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import type { CvContent } from "@/lib/validation/schemas/cv";

export type { PoolJob } from "@/lib/validation/schemas/feed";

/* ── Types ──────────────────────────────────────────────────────────── */

export interface InitialProfile {
  headline: string;
  summary: string;
  skills: string[];
  avatarUrl: string | null;
  portfolio: PortfolioItem[];
  projects: ProfileProject[];
}
export interface AdaptOutput { headline: string; body: string }
export interface InitialPortfolio { slug: string; published: boolean; content: PortfolioContent | null }
export interface InitialCv { content: CvContent | null }
/** CV'yi uyarlamak için ilan seçici seçeneği. */
export interface CvJobOption { id: string; title: string }
/** Profil sayfasında gösterilen, bir platformdan çekilmiş public profil özeti. */
export interface ConnectedProfile {
  platform: PlatformId;
  headline: string;
  summary: string;
  skills: string[];
  avatarUrl: string | null;
  sourceUrl: string | null;
  fetchedAt: string;
  portfolio: PortfolioItem[];
}
export interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
  // Kart bazlı hatırlatıcı + teslim tarihi (opsiyonel; migration 0033).
  reminder_date?: string | null; deadline_date?: string | null;
  // Serbest etiketler (opsiyonel; migration 0034).
  tags?: string[] | null;
  // Bütçe metni (nakit-akışı projeksiyonu için; kolon mevcut — migration yok).
  budget?: string | null;
  // Referans işareti (opsiyonel; migration 0039).
  referred?: boolean | null;
}
export interface AnalyticsData {
  totalCredits: number; totalCount: number;
  byKind: Record<string, { count: number; credits: number }>;
  dailySeries: { date: string; credits: number }[];
}

/* ── Navigation ─────────────────────────────────────────────────────── */

export type BadgeKey = "jobs" | "connections";

/** Kenar çubuğu grupları (Solar Pop): işin akışı → varlıklar → pratik → yardım. */
export type NavGroup = "work" | "assets" | "practice" | "help";

// labelKey → i18n anahtarı (dashboard.nav.<labelKey>), tüketim noktasında t() ile çözülür.
export const NAV_ITEMS: { href: string; labelKey: string; icon: LucideIcon; badge?: BadgeKey; group: NavGroup }[] = [
  { href: "/dashboard",           labelKey: "overview",  icon: LayoutDashboard, group: "work" },
  { href: "/dashboard/jobs",      labelKey: "jobs",      icon: Briefcase, badge: "jobs", group: "work" },
  { href: "/dashboard/profile",   labelKey: "profile",   icon: User, group: "assets" },
  { href: "/dashboard/platforms", labelKey: "platforms", icon: Layers, badge: "connections", group: "assets" },
  { href: "/dashboard/portfolio", labelKey: "portfolio", icon: Globe, group: "assets" },
  { href: "/dashboard/cv",        labelKey: "cv",        icon: FileText, group: "assets" },
  { href: "/dashboard/interview", labelKey: "interview", icon: MessageSquare, group: "practice" },
  { href: "/dashboard/start",     labelKey: "start",     icon: Sparkles, group: "help" },
  { href: "/dashboard/feedback",  labelKey: "feedback",  icon: Mail, group: "help" },
];

export const NAV_GROUPS: NavGroup[] = ["work", "assets", "practice", "help"];

/** Nav aktif durumu: /dashboard yalnız exact; diğerleri alt-route'ları da kapsar. */
export function isNavActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/* ── Constants ──────────────────────────────────────────────────────── */

// Durum etiketleri i18n'de: jobs.status.<status>. Renk noktaları locale-nötr kalır.
export const STATUS_DOT: Record<JobStatus, string> = {
  saved: "bg-slate-400", applied: "bg-blue-500", awaiting_reply: "bg-cyan-400",
  interview: "bg-amber-500", offer: "bg-green-500", rejected: "bg-red-500",
};

export const PLATFORM_STYLES: Record<PlatformId, { accent: string; icon: string; badge: string; hero: string; ring: string }> = {
  linkedin: { accent: "border-t-4 border-t-blue-500",    icon: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",       badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",     hero: "from-blue-500/20 via-blue-500/[0.06] to-transparent",       ring: "ring-blue-500/50"    },
  upwork:   { accent: "border-t-4 border-t-green-500",   icon: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400",    badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",  hero: "from-green-500/20 via-green-500/[0.06] to-transparent",     ring: "ring-green-500/50"   },
  fiverr:   { accent: "border-t-4 border-t-emerald-500", icon: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", hero: "from-emerald-500/20 via-emerald-500/[0.06] to-transparent", ring: "ring-emerald-500/50" },
  freelancer:    { accent: "border-t-4 border-t-sky-500",    icon: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400",             badge: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",             hero: "from-sky-500/20 via-sky-500/[0.06] to-transparent",       ring: "ring-sky-500/50"     },
  contra:        { accent: "border-t-4 border-t-pink-500", icon: "bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400", badge: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300", hero: "from-pink-500/20 via-pink-500/[0.06] to-transparent", ring: "ring-pink-500/50"  },
  peopleperhour: { accent: "border-t-4 border-t-orange-500", icon: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300", hero: "from-orange-500/20 via-orange-500/[0.06] to-transparent", ring: "ring-orange-500/50"  },
  "99designs":   { accent: "border-t-4 border-t-pink-500",   icon: "bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400",         badge: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",         hero: "from-pink-500/20 via-pink-500/[0.06] to-transparent",     ring: "ring-pink-500/50"    },
  guru:          { accent: "border-t-4 border-t-teal-500",   icon: "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400",         badge: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",         hero: "from-teal-500/20 via-teal-500/[0.06] to-transparent",     ring: "ring-teal-500/50"    },
};

export const PLATFORM_URL_PLACEHOLDERS: Record<PlatformId, string> = {
  linkedin: "https://www.linkedin.com/in/kullanici-adi",
  upwork:   "https://www.upwork.com/freelancers/~profil-id",
  fiverr:   "https://www.fiverr.com/kullanici-adi",
  freelancer:    "https://www.freelancer.com/u/kullanici-adi",
  contra:        "https://contra.com/kullanici-adi",
  peopleperhour: "https://www.peopleperhour.com/freelancer/kullanici-adi",
  "99designs":   "https://99designs.com/profiles/kullanici-adi",
  guru:          "https://www.guru.com/freelancers/kullanici-adi",
};

// Tür etiketleri i18n'de: analytics.kind.<kind>. İkonlar locale-nötr.
// Her kullanım türüne ÖZELLİKLE ilgili ikon (jenerik şimşek/Zap yok). Çeviri türleri
// bilinçli olarak aynı Languages ikonunu paylaşır (tutarlı iconografi).
export const KIND_ICONS: Record<string, LucideIcon> = {
  adaptation: Layers,              // platform katmanlarına uyarlama
  portfolio_generation: Globe,     // public portfolyo sitesi
  job_match: Target,               // ilan × profil eşleştirme
  proposal: FileText,              // yazılı teklif metni
  job_translate: Languages,
  proposal_translate: Languages,
  profile_translate: Languages,
  followup: BellRing,              // takip hatırlatıcısı
  profile_suggest: Wand2,          // AI profil önerisi
  profile_import: Download,        // profil içe aktarma
  platform_sync: RefreshCw,        // bağlı profil çekimi
  public_analyze: Gauge,           // profil analiz skoru
  cv_generation: FileText,         // CV üretimi
  cv_tailor: Wand2,                // CV işe uyarlama
  cv_import: Download,             // CV içe aktarma
  cv_bullets: Wand2,               // CV madde güçlendirme
  cv_summary: Sparkles,            // CV özet üretimi
  interview_prep: MessageSquare,   // mülakat hazırlığı
  cover_letter: FileText,          // ön yazı (cover letter)
  mock_questions: MessageSquare,   // sahte mülakat soruları
  mock_answer: MessageSquare,      // sahte mülakat cevap değerlendirmesi
  negotiation: Handshake,          // maaş pazarlığı koçluğu
};

/* ── Helpers ────────────────────────────────────────────────────────── */

export function scoreColor(n: number) {
  if (n >= 70) return "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800";
  if (n >= 40) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800";
  return "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900";
}

export function scoreBarColor(n: number) {
  if (n >= 70) return "bg-green-500";
  if (n >= 40) return "bg-amber-500";
  return "bg-red-500";
}

/** ISO tarihini kaba göreli birime çevirir (i18n metni tüketimde uygulanır). */
export function formatRelativeTime(
  iso: string | null,
  now: Date = new Date(),
): { value: number; unit: "minute" | "hour" | "day" } | null {
  if (!iso) return null;
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return { value: minutes, unit: "minute" };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: "hour" };
  return { value: Math.floor(hours / 24), unit: "day" };
}

/* ── Shared visual tokens ───────────────────────────────────────────── */

/** Yükseltilmiş kart: yumuşak kenar + hover derinlik (rafine görünüm temeli). */
export const ELEVATED = 'transition-all duration-200';

interface Tint {
  /** Kart zemini — Solar Pop'ta ayrım KENARLIKLA değil düz renkle kurulur. */
  bg: string;
  iconBg: string;
  iconText: string;
  shadow: boolean;
}

// Solar Pop metrik tonları: beyaz (gölgeli) ve pembe/şeftali (gölgesiz).
export const TINT_CYAN: Tint = {
  bg: 'bg-[var(--white)]', iconBg: 'bg-[var(--surface-card-peach)]', iconText: 'text-[var(--flame-600)]', shadow: true,
};
export const TINT_VIOLET: Tint = {
  bg: 'bg-[var(--surface-card-alt)]', iconBg: 'bg-[var(--white)]', iconText: 'text-[var(--pink-600)]', shadow: false,
};
export const TINT_PEACH: Tint = {
  bg: 'bg-[var(--surface-card-peach)]', iconBg: 'bg-[var(--white)]', iconText: 'text-[var(--flame-600)]', shadow: false,
};
export const TINT_AMBER: Tint = {
  bg: 'bg-[var(--amber-200)]', iconBg: 'bg-[var(--white)]', iconText: 'text-[var(--flame-600)]', shadow: false,
};

/** Tek tip metrik kartı — Solar Pop: büyük rakam, tracked-out etiket, düz zemin. */
export function StatCard({
  icon: Icon, tint, label, value, sub, children,
}: {
  icon: LucideIcon;
  tint: Tint;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`grid min-w-0 gap-1.5 rounded-[var(--radius-sp-lg)] p-5 ${tint.bg}`}
      style={tint.shadow ? { boxShadow: "var(--shadow-soft)" } : undefined}
    >
      <span className={`inline-grid h-9 w-9 place-items-center rounded-[var(--radius-pill)] ${tint.iconBg} ${tint.iconText}`}>
        <Icon className='h-[17px] w-[17px]' />
      </span>
      <p
        className='tabular-nums'
        style={{ font: 'var(--fw-black) var(--fs-stat)/.9 var(--font-display)', letterSpacing: 'var(--tracking-display)', color: 'var(--text-strong)' }}
      >
        {value}
      </p>
      <p className='sp-label' style={{ color: 'var(--text-strong)' }}>{label}</p>
      {sub ? <p style={{ font: 'var(--fw-regular) var(--fs-label)/1.4 var(--font-body)', color: 'var(--ink-700)' }}>{sub}</p> : null}
      {children ? <div className='mt-1'>{children}</div> : null}
    </div>
  );
}


