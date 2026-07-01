import {
  User, Layers, Globe, Briefcase, Target, Sparkles, BarChart3, Link2, LayoutDashboard,
} from "lucide-react";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import type { JobStatus, JobMatchResult } from "@/lib/validation/schemas/job";
import type { PlatformId } from "@/lib/ai/platforms";

/* ── Types ──────────────────────────────────────────────────────────── */

export interface InitialProfile { headline: string; summary: string; skills: string[] }
export interface InitialPortfolio { slug: string; published: boolean; content: PortfolioContent | null }
export interface AdaptOutput { headline: string; body: string }
export interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
}
export interface AnalyticsData {
  totalUsd: number; totalCount: number;
  byKind: Record<string, { count: number; costUsd: number }>;
  dailySeries: { date: string; costUsd: number }[];
}

/* ── Navigation ─────────────────────────────────────────────────────── */

export type BadgeKey = "jobs" | "connections";

export const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; badge?: BadgeKey }[] = [
  { href: "/dashboard",           label: "Genel Bakış",      icon: LayoutDashboard },
  { href: "/dashboard/profile",   label: "Profil",            icon: User },
  { href: "/dashboard/adapt",     label: "Platform Uyarlama", icon: Layers },
  { href: "/dashboard/portfolio", label: "Portfolyo",         icon: Globe },
  { href: "/dashboard/jobs",      label: "İlanlar",           icon: Briefcase, badge: "jobs" },
  { href: "/dashboard/analytics", label: "Analitik",          icon: BarChart3 },
  { href: "/dashboard/accounts",  label: "Hesaplar",          icon: Link2,     badge: "connections" },
];

/* ── Constants ──────────────────────────────────────────────────────── */

export const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Kaydedildi", applied: "Başvuruldu", awaiting_reply: "Yanıt Bekleniyor",
  interview: "Görüşme", offer: "Teklif", rejected: "Reddedildi",
};

export const STATUS_DOT: Record<JobStatus, string> = {
  saved: "bg-slate-400", applied: "bg-blue-500", awaiting_reply: "bg-cyan-400",
  interview: "bg-amber-500", offer: "bg-green-500", rejected: "bg-red-500",
};

export const PLATFORM_STYLES: Record<PlatformId, { accent: string; icon: string; badge: string }> = {
  linkedin: { accent: "border-t-4 border-t-blue-500",    icon: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",       badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"     },
  upwork:   { accent: "border-t-4 border-t-green-500",   icon: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400",    badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"  },
  fiverr:   { accent: "border-t-4 border-t-emerald-500", icon: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  bionluk:  { accent: "border-t-4 border-t-violet-500",  icon: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400", badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  armut:    { accent: "border-t-4 border-t-orange-500",  icon: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export const PLATFORM_URL_PLACEHOLDERS: Record<PlatformId, string> = {
  linkedin: "https://www.linkedin.com/in/kullanici-adi",
  upwork:   "https://www.upwork.com/freelancers/~profil-id",
  fiverr:   "https://www.fiverr.com/kullanici-adi",
  bionluk:  "https://www.bionluk.com/kullanici-adi",
  armut:    "https://armut.com/kullanici/kullanici-adi",
};

export const KIND_LABELS: Record<string, string> = {
  adaptation: "Platform Uyarlama",
  portfolio_generation: "Portfolyo Üretimi",
  job_match: "İlan Eşleştirme",
  proposal: "Teklif Üretimi",
};

export const KIND_ICONS: Record<string, React.ElementType> = {
  adaptation: Layers,
  portfolio_generation: Globe,
  job_match: Target,
  proposal: Sparkles,
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

export function formatUsd(n: number) {
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

/* ── Shared visual tokens ───────────────────────────────────────────── */

/** Yükseltilmiş kart: yumuşak kenar + hover derinlik (rafine görünüm temeli). */
export const ELEVATED =
  "transition-all duration-200 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/25";

interface Tint {
  border: string;
  iconBg: string;
  iconText: string;
  glow: string;
}

export const TINT_CYAN: Tint = {
  border: "border-[#00F0FF]/15 hover:border-[#00F0FF]/35",
  iconBg: "bg-[#00F0FF]/10",
  iconText: "text-[#00F0FF]",
  glow: "bg-[#00F0FF]/20",
};

export const TINT_VIOLET: Tint = {
  border: "border-violet-500/15 dark:border-violet-500/20 hover:border-violet-500/40",
  iconBg: "bg-violet-500/10",
  iconText: "text-violet-400",
  glow: "bg-violet-500/25",
};

/** Tek tip metrik kartı: ikon rozeti + tabular değer + hover glow/lift. */
export function StatCard({
  icon: Icon, tint, label, value, sub, children,
}: {
  icon: React.ElementType;
  tint: Tint;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-card p-5 ${ELEVATED} hover:-translate-y-0.5 ${tint.border}`}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${tint.glow}`} />
      <div className={`relative mb-4 h-10 w-10 rounded-xl flex items-center justify-center ${tint.iconBg}`}>
        <Icon className={`h-[18px] w-[18px] ${tint.iconText}`} />
      </div>
      <p className="relative text-xs text-muted-foreground font-medium">{label}</p>
      <p className="relative text-2xl font-extrabold tabular-nums mt-0.5">{value}</p>
      {sub && <p className="relative text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
      {children && <div className="relative mt-3">{children}</div>}
    </div>
  );
}
