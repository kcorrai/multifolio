import Link from "next/link";
import {
  Layers, Globe, Briefcase, ArrowRight, ArrowUpRight,
  CheckCircle2, Target, Sparkles, ShieldCheck,
  FileText, Download, Compass, Gauge, Calculator, Scale, Puzzle, Gift, Tag, ClipboardCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CountUp } from "@/components/count-up";
import { PlatformLogo } from "@/components/platform-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { LandingMotion } from "@/components/landing/landing-motion";
import { Tilt } from "@/components/landing/tilt";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqSection } from "@/components/faq-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlatformId } from "@/lib/ai/platforms";

const PLATFORMS: PlatformId[] = ["linkedin", "upwork", "fiverr", "bionluk", "armut"];

/* ─── Circular progress ring ────────────────────────────────────── */
function CircleScore({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width="140" height="140" viewBox="0 0 130 130" className="-rotate-90" aria-hidden="true">
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="9" />
      <circle
        cx="65" cy="65" r={r} fill="none"
        stroke="var(--ring-arc)" strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="ring-draw"
        style={{ "--ring-circ": `${circ}`, "--ring-offset": `${offset}` } as React.CSSProperties}
      />
    </svg>
  );
}

/* ─── Score bar ─────────────────────────────────────────────────── */
function ScoreBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-white/50 font-medium">{label}</span>
        <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/6 overflow-hidden">
        <div
          className="h-full w-full rounded-full bar-fill"
          style={{
            "--bar-scale": value / 100,
            backgroundColor: "var(--ring-arc)",
            animationDelay: `${delay}ms`,
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

/* ─── Product mockup shown in hero ─────────────────────────────── */
async function ProductMockup() {
  const t = await getTranslations("landing.mockup");
  return (
    <div className="relative flex items-center justify-center py-10 anim-fade-in anim-d2">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-indigo-400/8 dark:bg-cyan-400/8 blur-[90px]" />

      <div style={{ perspective: "1000px" }}>
        <div className="card-3d card-spin-in relative rounded-3xl bg-white dark:bg-[#161923] w-[380px] overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-[#00F0FF]/40" />

          <div className="px-6 pt-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-600 dark:text-white">AY</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Ahmet Yılmaz</p>
                <p className="text-[11px] text-slate-400 dark:text-white/40">{t("role")}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-[#00F0FF] bg-indigo-50 dark:bg-[#00F0FF]/10 border border-indigo-200 dark:border-[#00F0FF]/25 rounded-full px-2.5 py-1">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="flex items-center gap-5 px-6 py-5">
            <div className="relative shrink-0">
              <CircleScore score={87} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <CountUp value={87} delay={1100} duration={1600} className="text-[24px] font-extrabold text-slate-900 dark:text-white leading-none" />
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--ring-arc)" }}>{t("scoreLabel")}</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold mb-2">{t("overallScore")}</p>
              <p className="text-[12px] text-slate-500 dark:text-white/55 leading-relaxed">
                {t("scoreNote")}
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="px-6 py-5 space-y-3.5">
            <ScoreBar label={t("platformFit")}  value={92} delay={1400} />
            <ScoreBar label={t("skillMatch")}   value={88} delay={1550} />
            <ScoreBar label={t("clientAppeal")} value={76} delay={1700} />
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="px-6 py-5 flex items-center justify-between">
            {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id, i) => (
              <div
                key={id}
                className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.04] p-1.5 logo-pop"
                style={{ animationDelay: `${2100 + i * 130}ms` }}
              >
                <PlatformLogo platform={id} size={16} />
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-indigo-500/20" />
        </div>
      </div>
    </div>
  );
}

/* ─── Landing page ──────────────────────────────────────────────── */
async function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  /* Her adımın yanında yaşayan mini demo — .sr-visible görününce oynar */
  const demoCard = "rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-5 h-44 flex flex-col justify-center";
  const demoLine = "h-2 rounded-full bg-slate-200 dark:bg-white/12 demo-grow";
  const cardBase = "group h-full rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 transition-all";

  /* Ücretsiz araçlar (kayıt gerektirmeyen public sayfalar) */
  const tools = [
    { href: "/analyze",  icon: Gauge,      key: "analyze",  accent: "#00F0FF" },
    { href: "/earnings", icon: Calculator, key: "earnings", accent: "#a78bfa" },
    { href: "/rate",     icon: Tag,           key: "rate",             accent: "#00F0FF" },
    { href: "/proposal-checker", icon: ClipboardCheck, key: "proposalChecker", accent: "#a78bfa" },
    { href: "/compare",  icon: Scale,         key: "compare",          accent: "#00F0FF" },
  ] as const;

  const steps = [
    {
      step: "01", title: t("how.step1.title"), desc: t("how.step1.desc"), delay: 0,
      demo: (
        <div className={demoCard}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-white">AY</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className={`${demoLine} w-28`} style={{ animationDelay: "150ms" }} />
              <div className={`${demoLine} w-20`} style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className={`${demoLine} w-full`} style={{ animationDelay: "450ms" }} />
            <div className={`${demoLine} w-5/6`}  style={{ animationDelay: "600ms" }} />
            <div className={`${demoLine} w-4/6`}  style={{ animationDelay: "750ms" }} />
          </div>
          <div className="flex gap-1.5">
            {["React", "Next.js", "UI/UX"].map((skill, i) => (
              <span
                key={skill}
                className="demo-pop rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:text-[#00F0FF]"
                style={{ animationDelay: `${900 + i * 120}ms` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      step: "02", title: t("how.step2.title"), desc: t("how.step2.desc"), delay: 100,
      demo: (
        <div className={`${demoCard} gap-3`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F0FF] anim-sparkle" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">{t("demos.adapting")}</span>
          </div>
          <div className="space-y-2.5">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/8 demo-shimmer" />
            <div className="h-2 w-5/6 rounded-full bg-slate-100 dark:bg-white/8 demo-shimmer" />
            <div className="h-2 w-4/6 rounded-full bg-slate-100 dark:bg-white/8 demo-shimmer" />
          </div>
          <div className="flex items-center justify-between pt-1">
            {PLATFORMS.map((id, i) => (
              <div key={id} className="demo-pop rounded-lg border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.04] p-1.5" style={{ animationDelay: `${400 + i * 120}ms` }}>
                <PlatformLogo platform={id} size={14} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      step: "03", title: t("how.step3.title"), desc: t("how.step3.desc"), delay: 200,
      demo: (
        <div className={`${demoCard} gap-3.5`}>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] px-3 py-2.5">
            <div className="space-y-1.5">
              <div className={`${demoLine} w-24`} style={{ animationDelay: "150ms" }} />
              <div className={`${demoLine} w-16`} style={{ animationDelay: "300ms" }} />
            </div>
            <span className="demo-pop text-lg font-extrabold text-[#00F0FF]" style={{ animationDelay: "500ms" }}>
              87<span className="text-[9px] font-bold uppercase tracking-wider ml-1 text-slate-400 dark:text-white/40">{t("demos.match")}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[t("demos.applied"), t("demos.interview"), t("demos.offer")].map((label, i) => (
              <span key={label} className="flex items-center gap-1.5">
                {i > 0 && <ArrowRight className="h-3 w-3 text-slate-300 dark:text-white/20" />}
                <span
                  className="demo-pop rounded-full border border-violet-500/25 bg-violet-500/8 px-2 py-0.5 text-[9px] font-bold text-violet-500 dark:text-violet-300"
                  style={{ animationDelay: `${700 + i * 150}ms` }}
                >
                  {label}
                </span>
              </span>
            ))}
          </div>
          <div className="demo-pop flex items-center gap-1.5" style={{ animationDelay: "1200ms" }}>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">{t("demos.ready")}</span>
          </div>
        </div>
      ),
    },
  ];

  // SoftwareApplication structured data (Google zengin sonuç: uygulama + fiyat).
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: tc("metaDescription"),
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to start with 100 credits — pay-as-you-go, no subscription.",
    },
  };

  // HowTo structured data ("nasıl çalışır" 3 adımı) — Google zengin sonuç.
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("how.title"),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <JsonLd data={softwareLd} />
      <JsonLd data={howToLd} />

      {/* Sakin ambient aurora (2D CSS — WebGL yok); üst folda yumuşak gradyan,
          alta doğru maskeyle söner → diğer bölümler tertemiz. İçeriğin ARDINDA (z-0) */}
      <div aria-hidden className="landing-aurora">
        <span className="a1" />
        <span className="a2" />
        <span className="a3" />
      </div>
      {/* Hareket kontrolcüsü — kök CSS değişkenleri (pointer/scroll) mikro-animasyonları besler */}
      <LandingMotion />

      <div className="relative z-10">
      <SiteHeader isLoggedIn={isLoggedIn} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="par absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-[#00F0FF]/6 blur-[100px]" style={{ "--par-from": "80px", "--par-to": "-80px" } as React.CSSProperties} />
          <div className="par absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" style={{ "--par-from": "-60px", "--par-to": "90px" } as React.CSSProperties} />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="anim-fade-up anim-d0 inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-3.5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />
              <span className="text-xs font-semibold text-slate-600 dark:text-white/70">{t("hero.badge")}</span>
            </div>

            <h1 className="anim-fade-up anim-d1 text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              {t.rich("hero.title", {
                hl: (chunks) => (
                  <span className="bg-gradient-to-r from-[#00F0FF] to-violet-400 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </h1>

            <p className="anim-fade-up anim-d2 text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-md font-medium">
              {t("hero.subtitle")}
            </p>

            <div className="anim-fade-up anim-d3 flex items-center gap-2 flex-wrap pt-1">
              {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id) => (
                <div key={id} className="rounded-lg border border-white/8 bg-white/[0.05] p-1.5 backdrop-blur-sm">
                  <PlatformLogo platform={id} size={16} />
                </div>
              ))}
              <span className="text-xs text-slate-400 dark:text-[#94A3B8]/60 font-medium">{t("hero.platformsSupported")}</span>
            </div>

            <div className="anim-fade-up anim-d4 flex flex-wrap items-center gap-3 pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="anim-neon-pulse inline-flex items-center h-12 px-7 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors"
                >
                  {tc("goToDashboard")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="anim-neon-pulse inline-flex items-center h-12 px-7 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors"
                  >
                    {t("hero.ctaPrimary")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center h-12 px-7 rounded-xl text-base font-semibold border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-colors"
                  >
                    {t("hero.ctaSecondary")}
                  </Link>
                </>
              )}
            </div>

            <div className="anim-fade-up anim-d5 flex flex-wrap gap-4 pt-1">
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-[#94A3B8]/70 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00F0FF] shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <ProductMockup />
          </div>
        </div>
      </section>


      {/* Sosyal kanıt — kayan yorum şeridi (desteklenen platformların hemen üstünde) */}
      <TestimonialsSection />

      {/* Platforms strip */}
      <ScrollReveal className="mx-auto max-w-6xl px-8 py-14">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-8">
          {t("platformsStrip.title")}
        </p>
        <div className="drift-x flex flex-wrap items-center justify-center gap-3" style={{ "--drift": "26px" } as React.CSSProperties}>
          {([
            { id: "linkedin" as PlatformId, label: "LinkedIn" },
            { id: "upwork"   as PlatformId, label: "Upwork"   },
            { id: "fiverr"   as PlatformId, label: "Fiverr"   },
            { id: "bionluk"  as PlatformId, label: "Bionluk"  },
            { id: "armut"    as PlatformId, label: "Armut"    },
          ]).map(({ id, label }) => (
            <div key={id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.05] px-5 py-3 backdrop-blur-sm hover:bg-white/[0.09] hover:border-white/15 transition-colors">
              <PlatformLogo platform={id} size={20} />
              <span className="text-sm font-semibold text-slate-700 dark:text-[#94A3B8]">{label}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-8 pb-24">
        <ScrollReveal>
          <div className="text-center space-y-3 mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("features.eyebrow")}</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{t("features.title")}</h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">
              {t("features.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* Bento grid — kartlar fareyle 3D eğilir (sahneyle aynı pointer) */}
        <div className="grid md:grid-cols-6 gap-5">

          {/* Uyarlama — büyük kart: bir profil beş platforma dağılır */}
          <ScrollReveal delay={0} className="md:col-span-4">
            <Tilt fill>
              <div className={`${cardBase} hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md hover:shadow-[#00F0FF]/5 grid md:grid-cols-2 gap-6 items-center`}>
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-[#00F0FF]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t("features.adapt.title")}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">
                      {t("features.adapt.desc")}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/12 demo-grow" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-4/6 rounded-full bg-slate-200 dark:bg-white/12 demo-grow" style={{ animationDelay: "300ms" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-[#00F0FF]/50 to-violet-400/50" />
                    <Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />
                    <div className="h-px flex-1 bg-gradient-to-r from-violet-400/50 to-[#00F0FF]/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    {PLATFORMS.map((id, i) => (
                      <div key={id} className="demo-pop rounded-lg border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.05] p-1.5" style={{ animationDelay: `${500 + i * 120}ms` }}>
                        <PlatformLogo platform={id} size={16} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* Eşleştirme — skor sayacı */}
          <ScrollReveal delay={80} className="md:col-span-2">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-violet-500/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-[#00F0FF]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CountUp value={87} duration={1400} className="text-4xl font-extrabold text-[#00F0FF] tabular-nums" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">{t("demos.match")}</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.matching.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.matching.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* CV oluşturucu — mini CV + PDF (YENİ) */}
          <ScrollReveal delay={0} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md`}>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#00F0FF]" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/25 rounded-full px-2.5 py-1">
                    <Download className="h-3 w-3" /> {t("demos.pdf")}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-white">AY</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className={`${demoLine} w-24`} style={{ animationDelay: "150ms" }} />
                      <div className={`${demoLine} w-16`} style={{ animationDelay: "280ms" }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{t("demos.experience")}</p>
                    <div className={`${demoLine} w-full`} style={{ animationDelay: "420ms" }} />
                    <div className={`${demoLine} w-5/6`}  style={{ animationDelay: "560ms" }} />
                  </div>
                  <div className="flex gap-1.5">
                    {["React", "Next.js", "TS"].map((skill, i) => (
                      <span key={skill} className="demo-pop rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:text-[#00F0FF]" style={{ animationDelay: `${750 + i * 120}ms` }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.cv.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.cv.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* İş keşfi — skorlu ilan akışı (YENİ) */}
          <ScrollReveal delay={80} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-violet-500/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Compass className="h-5 w-5 text-violet-400" />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] divide-y divide-slate-200 dark:divide-white/8 overflow-hidden">
                  {[
                    { title: t("demos.jobA"), score: 92, tone: "text-emerald-500 dark:text-emerald-400", isNew: true },
                    { title: t("demos.jobB"), score: 78, tone: "text-[#00F0FF]", isNew: false },
                    { title: t("demos.jobC"), score: 85, tone: "text-violet-500 dark:text-violet-300", isNew: false },
                  ].map(({ title, score, tone, isNew }, i) => (
                    <div key={title} className="demo-pop flex items-center justify-between gap-3 px-3 py-2.5" style={{ animationDelay: `${200 + i * 160}ms` }}>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-white/80 truncate">{title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-medium text-slate-400 dark:text-white/35">{t("demos.remote")}</span>
                          {isNew && <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-px text-[8px] font-bold text-emerald-600 dark:text-emerald-400">{t("demos.new")}</span>}
                        </div>
                      </div>
                      <span className={`text-sm font-extrabold tabular-nums shrink-0 ${tone}`}>
                        {score}<span className="text-[8px] font-bold uppercase tracking-wider ml-0.5 text-slate-400 dark:text-white/35">{t("demos.fit")}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.discovery.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.discovery.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* AI teklif — daktilo efekti */}
          <ScrollReveal delay={0} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] p-3.5">
                  <p className="demo-type text-[12px] text-slate-600 dark:text-white/70 leading-relaxed font-medium">
                    {t("demos.proposal")}<span className="demo-caret text-[#00F0FF] font-bold">▍</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.ai.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.ai.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* Takip — pipeline rozetleri */}
          <ScrollReveal delay={80} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-violet-500/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                {/* Mini pipeline huni (gerçek PipelineStats'i yansıtır) */}
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">{t("demos.pipeline")}</span>
                    <span className="demo-pop text-sm font-extrabold text-[#00F0FF]" style={{ animationDelay: "600ms" }}>
                      40%<span className="text-[9px] font-bold ml-1 text-slate-400 dark:text-white/40">{t("demos.responseRate")}</span>
                    </span>
                  </div>
                  {[
                    { label: t("demos.funnelSent"),      value: 10, color: "bg-slate-400 dark:bg-slate-500" },
                    { label: t("demos.funnelResponded"), value: 4,  color: "bg-[#00F0FF]" },
                    { label: t("demos.interview"),       value: 3,  color: "bg-amber-500" },
                    { label: t("demos.offer"),           value: 1,  color: "bg-emerald-500" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-right text-[10px] font-medium text-slate-400 dark:text-white/40">{label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-white/8 overflow-hidden">
                        <div className={`h-full rounded-full ${color} demo-grow`} style={{ width: `${value * 10}%`, animationDelay: `${200 + i * 140}ms` }} />
                      </div>
                      <span className="w-4 shrink-0 text-right text-[10px] font-bold tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.tracking.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.tracking.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* Portfolyo — mini tarayıcı penceresi */}
          <ScrollReveal delay={0} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-violet-400" />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/8 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/15" />
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/15" />
                    <span className="ml-1 flex-1 rounded-md bg-white dark:bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold text-slate-400 dark:text-white/40 truncate">
                      {t("demos.portfolioUrl")}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 w-24 rounded-full bg-slate-200 dark:bg-white/15 demo-grow" style={{ animationDelay: "200ms" }} />
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 demo-grow" style={{ animationDelay: "350ms" }} />
                    <div className="h-2 w-5/6 rounded-full bg-slate-200 dark:bg-white/10 demo-grow" style={{ animationDelay: "500ms" }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.portfolio.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.portfolio.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* Güvenlik */}
          <ScrollReveal delay={80} className="md:col-span-3">
            <Tilt fill>
              <div className={`${cardBase} space-y-4 hover:border-violet-500/20 hover:shadow-md`}>
                <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-[#00F0FF]" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[t("features.secure.badge1"), t("features.secure.badge2"), t("features.secure.badge3")].map((tech, i) => (
                    <span
                      key={tech}
                      className="demo-pop rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                      style={{ animationDelay: `${200 + i * 120}ms` }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("features.secure.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("features.secure.desc")}</p>
                </div>
              </div>
            </Tilt>
          </ScrollReveal>
        </div>
      </section>

      {/* Free tools — kayıt gerektirmeyen public araçlar */}
      <section className="mx-auto max-w-6xl px-8 pb-24">
        <ScrollReveal>
          <div className="text-center space-y-3 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{t("tools.eyebrow")}</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{t("tools.title")}</h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">{t("tools.subtitle")}</p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(({ href, icon: Icon, key, accent }, i) => (
            <ScrollReveal key={key} delay={i * 80}>
              <Tilt fill>
                <Link
                  href={href}
                  className={`${cardBase} block space-y-4 hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${accent}1a`, borderColor: `${accent}33` }}>
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-1">
                      {t("tools.freeBadge")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t(`tools.${key}.title`)}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t(`tools.${key}.desc`)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: accent }}>
                    {t("tools.open")} <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </Tilt>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#161923]/40 py-24">
        <div className="mx-auto max-w-6xl px-8">
          <ScrollReveal>
            <div className="text-center space-y-3 mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{t("how.eyebrow")}</p>
              <h2 className="text-4xl font-extrabold tracking-tight">{t("how.title")}</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc, delay, demo }) => (
              <ScrollReveal key={step} delay={delay}>
                <div className="space-y-4">
                  <Tilt>{demo}</Tilt>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-slate-200 dark:text-white/10 tabular-nums">{step}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#00F0FF]/60 to-transparent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Grow — tek tıkla içe aktar + davet et kazan */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <ScrollReveal>
          <div className="text-center space-y-3 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("grow.eyebrow")}</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{t("grow.title")}</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 gap-5">
          {/* Tek tıkla içe aktar (uzantı) */}
          <ScrollReveal delay={0}>
            <Tilt fill>
              <div className={`${cardBase} flex flex-col gap-4 hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0">
                    <Puzzle className="h-5 w-5 text-[#00F0FF]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["upwork","fiverr","linkedin"] as PlatformId[]).map((id) => (
                      <div key={id} className="rounded-lg border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.04] p-1.5">
                        <PlatformLogo platform={id} size={16} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("grow.import.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("grow.import.desc")}</p>
                </div>
                <Link href={isLoggedIn ? "/dashboard/import" : "/signup"} className="inline-flex items-center gap-1 text-sm font-bold text-[#00F0FF]">
                  {t("grow.import.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Tilt>
          </ScrollReveal>

          {/* Davet et kazan (referans) */}
          <ScrollReveal delay={80}>
            <Tilt fill>
              <div className={`${cardBase} flex flex-col gap-4 hover:border-violet-500/20 hover:shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Gift className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-violet-500/25 bg-violet-500/8 px-2.5 py-1 text-[11px] font-extrabold text-violet-500 dark:text-violet-300">+20</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-white/25" />
                    <span className="rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-2.5 py-1 text-[11px] font-extrabold text-slate-600 dark:text-[#00F0FF]">+20</span>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t("grow.referral.title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("grow.referral.desc")}</p>
                </div>
                <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="inline-flex items-center gap-1 text-sm font-bold text-violet-400">
                  {t("grow.referral.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Tilt>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection isLoggedIn={isLoggedIn} />

      {/* FAQ */}
      <FaqSection />

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-8 py-24 text-center">
        <ScrollReveal scale>
          <div className="relative rounded-3xl border border-[#00F0FF]/15 dark:border-[#00F0FF]/10 bg-slate-50 dark:bg-[#161923] px-8 py-16 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="par absolute left-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#00F0FF]/6 blur-[80px]" style={{ "--par-from": "50px", "--par-to": "-50px" } as React.CSSProperties} />
              <div className="par absolute right-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[80px]" style={{ "--par-from": "-40px", "--par-to": "60px" } as React.CSSProperties} />
            </div>
            <div className="relative space-y-5">
              <h2 className="text-4xl font-extrabold tracking-tight">
                {t("finalCta.title")}
              </h2>
              <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-md mx-auto">
                {t("finalCta.subtitle")}
              </p>
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="anim-neon-pulse inline-flex items-center h-12 px-8 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors mt-2"
              >
                {isLoggedIn ? tc("goToDashboard") : t("cta.signupFree")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <SiteFooter />
      </div>
    </div>
  );
}

/* ─── Root server component ─────────────────────────────────────── */
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isLoggedIn={!!user} />;
}
