// Ana sayfa (landing) — Solar Pop tasarımı.
// Referans komp: docs/design/solar-pop/multifolio-landing-solar-pop.html
// Sunucu bileşeni: oturum durumuna göre header/CTA varyantları değişir.
// SEO korundu: tek h1, JSON-LD (SoftwareApplication + Organization + HowTo/FAQ),
// self-canonical ve tüm kopya sunucuda render edilir.
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Sun, Check, Heart } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { PricingSection } from "@/components/pricing-section";
import { Blob, Blobs } from "@/components/solar/primitives";
import { SolarHeader, SolarFooter, HeaderAuth, SectionHeading } from "@/components/solar/site-chrome";
import { LandingNavLinks, LandingMobileNav } from "@/components/solar/landing-nav";
import { HeroStack } from "@/components/landing/solar/hero-stack";
import { ShowcaseRail } from "@/components/landing/solar/showcase-rail";
import { FaqAccordion } from "@/components/landing/solar/faq-accordion";
import { FeatureCards, ToolCards } from "@/components/landing/solar/sections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const CREDIT_COSTS_SHOWN = ["proposal", "rewrite", "portfolio", "cv"] as const;
const TRUST_KEYS = ["card", "credit", "payOnly"] as const;
const FAQ_IDS = ["credit", "subscription", "checkout", "invent", "detect"] as const;
const STAGE_IDS = ["profile", "adapt", "feed", "proposal", "portfolio", "cv"] as const;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const t = await getTranslations("landing.sp");
  const tc = await getTranslations("common");
  const tf = await getTranslations("landing.sp.faq");
  const tsh = await getTranslations("landing.sp.showcase");

  /* ── Yapısal veri (zengin sonuç) ─────────────────────────────────── */
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
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    description: tc("metaDescription"),
  };
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tsh("title"),
    step: STAGE_IDS.map((id, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: tsh(`stages.${id}.title`),
      text: tsh(`stages.${id}.caption`),
    })),
  };
  // Akordeon cevapları yalnız açıkken DOM'da → SSS'yi ayrıca yapısal veriyle yayınla.
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_IDS.map((id) => ({
      "@type": "Question",
      name: tf(`q.${id}`),
      acceptedAnswer: { "@type": "Answer", text: tf(`a.${id}`) },
    })),
  };

  return (
    <div className="sp-page">
      <JsonLd data={softwareLd} />
      <JsonLd data={orgLd} />
      <JsonLd data={howToLd} />
      <JsonLd data={faqLd} />

      <SolarHeader
        nav={<LandingNavLinks />}
        actions={
          <div className="flex items-center gap-3">
            <span className="sp-toolnav flex items-center">
              <HeaderAuth isLoggedIn={isLoggedIn} />
            </span>
            <LandingMobileNav isLoggedIn={isLoggedIn} />
          </div>
        }
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section id="top" className="sp-section relative" style={{ paddingTop: 34 }}>
        <Blobs>
          <Blob size={340} color="var(--peach-200)" shape="blob" opacity={0.75} style={{ right: -110, top: -60 }} />
          <Blob size={190} color="var(--pink-300)" shape="petal" opacity={0.6} rotate={18} style={{ left: -78, bottom: 40 }} />
          <Blob size={120} color="var(--amber-200)" shape="circle" style={{ right: "38%", bottom: -40 }} />
        </Blobs>

        <div className="sp-wrap relative z-[2]">
          <div className="sp-hero">
            <div className="grid justify-items-start gap-6">
              <span className="sp-chip sp-chip--static">
                <Sun size={14} />
                {t("hero.badge")}
              </span>

              <h1 className="sp-h1" style={{ fontSize: "var(--fs-display-xl)", maxWidth: "15ch" }}>
                {t("hero.titleA")}
                <br />
                {t("hero.titleB")} <span className="sp-script sp-script--lg">{t("hero.script")}</span>
              </h1>

              <p className="sp-body sp-body--lead" style={{ maxWidth: "46ch" }}>{t("hero.lede")}</p>

              <div className="flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard" className="sp-btn sp-btn--lg">
                      {t("hero.ctaDashboard")} <ArrowRight size={16} />
                    </Link>
                    <Link href="/pricing" className="sp-btn sp-btn--lg sp-btn--ghost">{t("hero.ctaCredits")}</Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup" className="sp-btn sp-btn--lg">
                      {t("hero.ctaStart")} <ArrowRight size={16} />
                    </Link>
                    <Link href="#showcase" className="sp-btn sp-btn--lg sp-btn--ghost">
                      <Sun size={16} /> {t("hero.ctaWatch")}
                    </Link>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                {TRUST_KEYS.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-[7px]"
                    style={{ font: "var(--fw-medium) var(--fs-body-s)/1 var(--font-body)", color: "var(--text-body)" }}
                  >
                    <span
                      className="inline-grid h-5 w-5 place-items-center rounded-[var(--radius-pill)]"
                      style={{ background: "var(--surface-card-alt)", color: "var(--pink-600)" }}
                    >
                      <Check size={12} />
                    </span>
                    {t(`hero.trust.${k}`)}
                  </span>
                ))}
              </div>
            </div>

            <HeroStack />
          </div>
        </div>
      </section>

      {/* ── Kredi modeli ──────────────────────────────────────────────── */}
      <section className="sp-section">
        <div className="sp-wrap">
          <div className="sp-panel grid gap-[22px]" style={{ background: "var(--surface-card-peach)", padding: 28 }}>
            <div className="flex flex-wrap items-end gap-[18px]">
              <div className="mr-auto">
                <SectionHeading eyebrow={t("credits.eyebrow")} title={t("credits.title")} script={t("credits.script")} />
              </div>
              <p className="sp-body" style={{ maxWidth: "38ch" }}>{t("credits.lede")}</p>
            </div>
            <div className="sp-grid-4">
              {CREDIT_COSTS_SHOWN.map((k) => (
                <div key={k} className="grid gap-1.5 rounded-[var(--radius-sp-lg)] p-5" style={{ background: "var(--white)" }}>
                  <span
                    className="tabular-nums"
                    style={{ font: "var(--fw-black) var(--fs-stat)/1 var(--font-display)", letterSpacing: "var(--tracking-display)", color: "var(--text-heading)" }}
                  >
                    {t(`credits.items.${k}.cost`)}
                  </span>
                  <span
                    style={{ font: "var(--fw-bold) var(--fs-body)/1.3 var(--font-display)", textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-strong)" }}
                  >
                    {t(`credits.items.${k}.label`)}
                  </span>
                  <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>
                    {t(`credits.items.${k}.note`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ürün vitrini ──────────────────────────────────────────────── */}
      <section id="showcase" className="sp-section">
        <div className="sp-wrap">
          <ShowcaseRail />
        </div>
      </section>

      {/* ── Özellikler ────────────────────────────────────────────────── */}
      <section id="features" className="sp-section">
        <div className="sp-wrap grid gap-7">
          <SectionHeading eyebrow={t("features.eyebrow")} title={t("features.title")} script={t("features.script")} />
          <FeatureCards />
          <div
            className="flex flex-wrap items-center gap-3.5 rounded-[var(--radius-sp-lg)] px-6 py-5"
            style={{ background: "var(--surface-card-alt)" }}
          >
            <span
              className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--radius-pill)]"
              style={{ background: "var(--pink-200)", color: "var(--pink-600)" }}
            >
              <Heart size={16} />
            </span>
            <span className="sp-sub" style={{ fontSize: "var(--fs-body)" }}>{t("features.privacyTitle")}</span>
            <span className="sp-body">{t("features.privacyBody")}</span>
          </div>
        </div>
      </section>

      {/* ── Ücretsiz araçlar ──────────────────────────────────────────── */}
      <section id="tools" className="sp-section">
        <div className="sp-wrap grid gap-7">
          <SectionHeading
            eyebrow={t("tools.eyebrow")}
            title={t("tools.title")}
            script={t("tools.script")}
            lede={t("tools.lede")}
          />
          <ToolCards />
        </div>
      </section>

      {/* ── Fiyatlandırma (paylaşılan bölüm — /pricing ile aynı) ──────── */}
      <PricingSection isLoggedIn={isLoggedIn} />

      {/* ── SSS ───────────────────────────────────────────────────────── */}
      <section id="faq" className="sp-section">
        <div className="sp-wrap sp-faq">
          <div className="grid gap-3">
            <SectionHeading eyebrow={tf("eyebrow")} title={tf("title")} script={tf("script")} />
            <p className="sp-body" style={{ maxWidth: "34ch" }}>{tf("lede")}</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Kapanış CTA ───────────────────────────────────────────────── */}
      <section className="sp-section">
        <div className="sp-wrap">
          <div
            className="sp-panel grid justify-items-center gap-[22px] text-center"
            style={{ background: "var(--surface-pink)", padding: "72px 40px" }}
          >
            <Blobs>
              <Blob size={260} color="var(--pink-400)" shape="blob" style={{ left: -80, top: -70 }} />
              <Blob size={200} color="var(--pink-600)" shape="petal" opacity={0.7} rotate={24} style={{ right: -60, bottom: -70 }} />
            </Blobs>

            <h2 className="sp-h2 relative z-[2]" style={{ color: "var(--white)", maxWidth: "22ch" }}>
              {t("finalCta.title")}{" "}
              <span className="sp-script sp-script--lg" style={{ color: "var(--ink-900)" }}>{t("finalCta.script")}</span>
            </h2>
            <p className="sp-body sp-body--lead relative z-[2]" style={{ color: "var(--white)", maxWidth: "48ch" }}>
              {t("finalCta.lede")}
            </p>
            <div className="relative z-[2] grid justify-items-center gap-3.5">
              <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="sp-btn sp-btn--lg sp-btn--quiet">
                {isLoggedIn ? t("finalCta.ctaIn") : t("finalCta.ctaOut")} <ArrowRight size={16} />
              </Link>
              <span className="sp-label" style={{ color: "var(--white)" }}>{t("finalCta.note")}</span>
            </div>
          </div>
        </div>
      </section>

      <SolarFooter />
    </div>
  );
}
