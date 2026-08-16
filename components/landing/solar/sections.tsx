// Landing'in statik bölümleri (SUNUCU bileşenleri): özellik bento'su ve ücretsiz
// araç ızgarası. Kart içi "demo"lar gerçek ürün ekranlarının minyatürüdür — hepsi
// düz işaretleme, animasyon yok (hareket bütçesi hero destesi + vitrin rayında).
// Referans komp: docs/design/solar-pop/multifolio-landing-solar-pop.html
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Sparkles, Sun, Flower2, Asterisk, Globe, Package, ArrowRight, Check, type LucideIcon,
} from "lucide-react";
import { TOOLS } from "@/lib/tools/catalog";

/* ─── Özellik bento'su ─────────────────────────────────────────────── */
const FEATURES = [
  { id: "feed", icon: Sparkles, bg: "var(--surface-card)" },
  { id: "scores", icon: Sun, bg: "var(--surface-card-peach)" },
  { id: "proposals", icon: Flower2, bg: "var(--surface-card-alt)" },
  { id: "pipeline", icon: Asterisk, bg: "var(--surface-card)" },
  { id: "portfolio", icon: Globe, bg: "var(--surface-card-alt)" },
  { id: "cv", icon: Package, bg: "var(--surface-card-peach)" },
] as const;

const DEMO_JOBS = [
  { id: "a", score: 92, good: true },
  { id: "b", score: 88, good: true },
  { id: "c", score: 74, good: false },
  { id: "d", score: 61, good: false },
] as const;

function MiniBar({ label, pct, ink }: { label: string; pct: number; ink: string }) {
  return (
    <div className="grid gap-1.5">
      <div
        className="flex justify-between gap-2.5"
        style={{ font: "var(--fw-bold) var(--fs-body-s)/1 var(--font-display)", textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-body)" }}
      >
        <span>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-strong)" }}>{pct}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--surface-muted)" }}>
        <div className="h-full rounded-[var(--radius-pill)]" style={{ width: `${pct}%`, background: ink }} />
      </div>
    </div>
  );
}

async function FeatureDemo({ id }: { id: (typeof FEATURES)[number]["id"] }) {
  const t = await getTranslations("landing.sp.features");

  if (id === "feed") {
    return (
      <div className="grid gap-2">
        {DEMO_JOBS.map((j) => (
          <div
            key={j.id}
            className="flex items-center gap-2.5 rounded-[var(--radius-sp-md)] px-[13px] py-[11px]"
            style={{ background: "var(--white)" }}
          >
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span
                className="truncate"
                style={{ font: "var(--fw-bold) var(--fs-body-s)/1.2 var(--font-display)", textTransform: "uppercase", letterSpacing: ".02em", color: "var(--text-strong)" }}
              >
                {t(`demo.jobs.${j.id}.role`)}
              </span>
              <span className="truncate" style={{ font: "var(--fw-regular) var(--fs-label)/1.3 var(--font-body)", color: "var(--text-muted)" }}>
                {t(`demo.jobs.${j.id}.meta`)}
              </span>
            </span>
            <span
              className="tabular-nums"
              style={{ font: "var(--fw-black) var(--fs-body)/1 var(--font-display)", color: j.good ? "var(--pink-600)" : "var(--flame-600)" }}
            >
              {j.score}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "scores") {
    return (
      <div className="flex items-center gap-[18px]">
        <div
          className="grid h-24 w-24 shrink-0 place-items-center rounded-[var(--radius-pill)]"
          style={{ background: "conic-gradient(var(--flame-500) 0% 87%, var(--cream-300) 87% 100%)" }}
        >
          <div className="grid h-[74px] w-[74px] place-items-center rounded-[var(--radius-pill)]" style={{ background: "var(--white)" }}>
            <span className="tabular-nums" style={{ font: "var(--fw-black) 28px/1 var(--font-display)", color: "var(--text-strong)" }}>87</span>
            <span className="sp-label sp-label--muted" style={{ letterSpacing: ".08em" }}>/ 100</span>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2.5">
          <MiniBar label={t("demo.bars.fit")} pct={91} ink="var(--flame-500)" />
          <MiniBar label={t("demo.bars.skill")} pct={84} ink="var(--pink-500)" />
          <MiniBar label={t("demo.bars.appeal")} pct={79} ink="var(--amber-400)" />
        </div>
      </div>
    );
  }

  if (id === "proposals") {
    return (
      <div className="rounded-[var(--radius-sp-md)] p-4" style={{ background: "var(--white)", minHeight: 96 }}>
        <p style={{ font: "var(--fw-regular) var(--fs-body-s)/1.75 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>
          {t("demo.proposal")}
        </p>
      </div>
    );
  }

  if (id === "pipeline") {
    const rows = [
      { k: "sent", v: 48, w: 100, ink: "var(--flame-500)" },
      { k: "viewed", v: 31, w: 65, ink: "var(--flame-400)" },
      { k: "replied", v: 19, w: 40, ink: "var(--pink-500)" },
      { k: "interviewing", v: 6, w: 13, ink: "var(--pink-400)" },
    ] as const;
    return (
      <div className="grid gap-[9px]">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center gap-2.5">
            <span className="sp-label sp-label--muted w-[84px]" style={{ letterSpacing: ".06em" }}>{t(`demo.funnel.${r.k}`)}</span>
            <span className="h-[22px] flex-1 overflow-hidden rounded-[var(--radius-sp-sm)]" style={{ background: "var(--white)" }}>
              <span className="block h-full rounded-[var(--radius-sp-sm)]" style={{ width: `${r.w}%`, background: r.ink }} />
            </span>
            <span className="w-[26px] text-right tabular-nums" style={{ font: "var(--fw-black) var(--fs-body-s)/1 var(--font-display)", color: "var(--text-strong)" }}>
              {r.v}
            </span>
          </div>
        ))}
        <span
          className="mt-0.5"
          style={{ font: "var(--fw-bold) var(--fs-body-s)/1.4 var(--font-display)", textTransform: "uppercase", letterSpacing: ".03em", color: "var(--pink-600)" }}
        >
          {t("demo.funnel.summary")}
        </span>
      </div>
    );
  }

  if (id === "portfolio") {
    const tints = ["var(--peach-100)", "var(--pink-100)", "var(--amber-200)", "var(--pink-200)", "var(--peach-200)", "var(--cream-300)"];
    return (
      <div className="overflow-hidden rounded-[var(--radius-sp-md)]" style={{ background: "var(--white)" }}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="flex gap-1">
            {["var(--flame-400)", "var(--amber-400)", "var(--pink-400)"].map((c) => (
              <span key={c} className="h-[7px] w-[7px] rounded-[var(--radius-pill)]" style={{ background: c }} />
            ))}
          </span>
          <span style={{ font: "var(--fw-medium) var(--fs-label)/1 var(--font-body)", color: "var(--text-muted)" }}>/p/amara-kane</span>
        </div>
        <div className="grid gap-[9px] p-3.5" style={{ gridTemplateColumns: "repeat(3,1fr)" }} aria-hidden>
          {tints.map((c) => <span key={c} className="h-[38px] rounded-[var(--radius-sp-sm)]" style={{ background: c }} />)}
        </div>
      </div>
    );
  }

  // cv
  return (
    <div className="flex items-start gap-4">
      <div className="grid w-[100px] shrink-0 gap-1.5 rounded-[var(--radius-sp-md)] p-3" style={{ background: "var(--white)" }} aria-hidden>
        {[86, 60, 74, 50, 68, 44, 58].map((w, i) => (
          <span key={i} className="h-1 rounded-[3px]" style={{ width: `${w}%`, background: i === 0 ? "var(--flame-500)" : "var(--cream-400)" }} />
        ))}
      </div>
      <div className="grid gap-2.5">
        <span
          className="sp-label w-fit rounded-[var(--radius-pill)] px-[13px] py-[7px]"
          style={{ background: "var(--flame-500)", color: "var(--white)", letterSpacing: ".08em" }}
        >
          PDF
        </span>
        <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("demo.cv")}</span>
      </div>
    </div>
  );
}

export async function FeatureCards() {
  const t = await getTranslations("landing.sp.features");

  return (
    <div className="sp-grid-2">
      {FEATURES.map(({ id, icon: Icon, bg }) => (
        <div
          key={id}
          className="grid min-w-0 content-start gap-4 rounded-[var(--radius-sp-lg)] p-6"
          style={{ background: bg }}
        >
          <div className="grid gap-2.5">
            <span
              className="inline-grid h-[38px] w-[38px] place-items-center rounded-[var(--radius-pill)]"
              style={{ background: "var(--pink-200)", color: "var(--pink-600)" }}
            >
              <Icon size={18} />
            </span>
            <h3 className="sp-title">{t(`${id}.title`)}</h3>
            <p className="sp-body">{t(`${id}.copy`)}</p>
          </div>
          <FeatureDemo id={id} />
        </div>
      ))}
    </div>
  );
}

/* ─── Ücretsiz araç ızgarası ───────────────────────────────────────── */
const TOOL_BG: Record<string, string> = {
  rate: "var(--surface-card-peach)",
  roi: "var(--surface-card)",
  ats: "var(--surface-card-peach)",
  proposal: "var(--surface-card)",
  headline: "var(--surface-card-alt)",
  analyze: "var(--surface-card-alt)",
};

const TOOL_ICON: Record<string, LucideIcon> = {
  rate: Sun, roi: Asterisk, ats: Package, proposal: Check, headline: Flower2, analyze: Sparkles,
};

export async function ToolCards() {
  const t = await getTranslations("tools");
  const ts = await getTranslations("landing.sp.tools");

  return (
    <div className="sp-grid-3">
      {TOOLS.map((tool) => {
        const Icon = TOOL_ICON[tool.id];
        return (
          <Link
            key={tool.id}
            href={tool.href}
            className="sp-lift grid min-w-0 gap-[13px] rounded-[var(--radius-sp-lg)] p-6"
            style={{ background: TOOL_BG[tool.id] }}
          >
            <div className="flex items-center justify-between gap-2.5">
              <span
                className="inline-grid h-10 w-10 place-items-center rounded-[var(--radius-pill)]"
                style={{ background: "var(--white)", color: "var(--pink-600)" }}
              >
                <Icon size={18} />
              </span>
              <span
                className="sp-label rounded-[var(--radius-pill)] px-3 py-1.5"
                style={{ background: "var(--white)", color: "var(--flame-600)" }}
              >
                {ts("freeBadge")}
              </span>
            </div>
            <span className="sp-title">{t(`nav.${tool.id}`)}</span>
            <span className="sp-body">{t(`cross.blurb.${tool.id}`)}</span>
            <span className="sp-label inline-flex items-center gap-[7px]" style={{ color: "var(--flame-600)" }}>
              {ts("open")}
              <ArrowRight size={13} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
