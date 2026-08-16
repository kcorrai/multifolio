// /p/[slug] — genel portfolyo sayfası. Auth gerekmez; yalnızca published=true
// portfolyolar görünür. İçerik yapılandırılmış JSON (React metin render'ı otomatik
// escape eder; dangerouslySetInnerHTML YOK). Görsel tema kullanıcının seçtiği
// preset+vurgu rengine göre (lib/portfolio/theme). Motion global .anim-* ile
// (reduced-motion globals.css'te saygı görür).
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Archivo, Space_Grotesk, Fraunces } from "next/font/google";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowUpRight, Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portfolioContentSchema, type PortfolioContent } from "@/lib/validation/schemas/portfolio";
import { SITE_URL } from "@/lib/seo/site";
import { portfolioTheme, ACCENT_HEX, PORTFOLIO_PRESETS, type PortfolioPreset } from "@/lib/portfolio/theme";
import { LeadForm } from "@/components/portfolio/lead-form";
import { DemoThemeSwitcher } from "@/components/portfolio/demo-theme-switcher";
import { getSafeEmbed } from "@/lib/portfolio/embed";
import { validateContactEmail, validateContactUrl } from "@/lib/portfolio/contact";
import { buildPersonJsonLd } from "@/lib/portfolio/json-ld";
import { visibleGallery, visibleProjectGroups } from "@/lib/portfolio/media";
import { PublicGallery } from "@/components/portfolio/public-gallery";
import { ProjectShowcase } from "@/components/portfolio/project-showcase";
import { ZoomableImage } from "@/components/portfolio/zoomable-image";

// Uygulamanın mutlak taban URL'i (canonical + JSON-LD + og:url için). NEXT_PUBLIC_APP_URL
// kesin; yoksa proxy header'larından türetilir (app-url.ts deseni, next/headers ile).
async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Türkçe karakterler için latin-ext şart. Başlık fontu preset'e göre (sans/serif).
const archivo = Archivo({ subsets: ["latin", "latin-ext"], variable: "--font-archivo", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-space", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap" });

interface PageProps {
  params: Promise<{ slug: string }>;
  /** Yalnız /p/demo: vitrin değiştiricisinin seçtiği preset (`?preset=`). */
  searchParams?: Promise<{ preset?: string }>;
}

// Herkese açık "canlı demo" portfolyo (slug = "demo"): DB/auth GEREKTİRMEZ — landing'den
// gelen ziyaretçiye gerçek çıktı kalitesini gösterir. CTA'lar signup'a gider (dönüşüm).
const DEMO_TESTIMONIALS = [
  { id: "d1", author_name: "Deniz K.", author_role: "Founder, SaaS startup", quote: "Elif redesigned our dashboard and daily active use doubled. Clear thinking, fast delivery." },
  { id: "d2", author_name: "Marco R.", author_role: "Head of Product", quote: "One of the few designers who also ships production React. Rare and worth it." },
];
const demoContent = (preset: PortfolioPreset = "studio"): PortfolioContent => ({
  headline: "Elif Demir — Product Designer & Frontend Developer",
  bio:
    "I help startups turn messy ideas into clean, shippable products. Over 6 years I've designed and built web apps end-to-end — from user research and UI to production React. I care about clarity, speed, and results you can measure.\n\nCurrently open to freelance product design and frontend work.",
  skills: ["Product Design", "UI/UX", "Figma", "React", "Next.js", "TypeScript", "Design Systems", "Accessibility", "Prototyping", "Webflow"],
  projects: [
    { title: "SaaS analytics dashboard", description: "Redesigned a cluttered analytics tool into a focused dashboard used daily by 4,000+ teams.", problem: "Users couldn't find key metrics and support tickets were rising.", solution: "Ran 12 interviews, rebuilt the information architecture, and shipped a new React dashboard with saved views.", result: "Support tickets down 38%, daily active use up 2.1x." },
    { title: "Fintech onboarding flow", description: "Designed and built a 3-step onboarding that replaced a 9-screen form.", problem: "60% of new users dropped off before funding their account.", solution: "Cut the flow to 3 steps with inline validation and clear progress feedback.", result: "Activation rose from 40% to 71% in six weeks." },
    { title: "E-commerce design system", description: "Built a component library and Figma kit for a fast-growing store.", problem: "Every page looked different and engineering was slow.", solution: "Created 40+ reusable components with design tokens and documentation.", result: "New pages ship 3x faster with a consistent brand." },
  ],
  layout: "gallery",
  theme: { preset, accent: "blue" },
  media: { avatarUrl: null, gallery: [], projectGroups: [] },
  contactEmail: null,
  contactUrl: `${SITE_URL}/signup`,
  embedUrl: null,
});

// cache() ile aynı istek içinde generateMetadata + page tek sorgu yapar.
const fetchPortfolio = cache(async (slug: string, demoPreset: PortfolioPreset = "studio") => {
  if (slug === "demo") {
    return { content: demoContent(demoPreset), updatedAt: "2026-07-01T00:00:00.000Z", userId: "demo" };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("user_id, content, updated_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = portfolioContentSchema.safeParse(data.content);
  if (!parsed.success) return null;
  return { content: parsed.data, updatedAt: data.updated_at as string, userId: data.user_id as string };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await fetchPortfolio(slug);
  if (!portfolio) {
    const t = await getTranslations("portfolioPublic");
    return { title: t("notFoundTitle") };
  }
  const { headline, bio, media } = portfolio.content;
  const description = bio.slice(0, 160);
  const base = await getBaseUrl();
  const url = `${base}/p/${slug}`;
  const images = media.avatarUrl ? [{ url: media.avatarUrl }] : undefined;
  return {
    metadataBase: new URL(base),
    title: headline,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: headline,
      description,
      type: "profile",
      url,
      siteName: "Multifolio",
      ...(images ? { images } : {}),
    },
    twitter: {
      // Avatar yoksa da dinamik opengraph-image fallback'i var → her zaman büyük kart.
      card: "summary_large_image",
      title: headline,
      description,
      ...(images ? { images } : {}),
    },
  };
}

export default async function PortfolioPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const isDemo = slug === "demo";
  // Vitrin değiştiricisi preset'i sunucuya taşır — düzen (ölçü/hiza/aralık)
  // sunucuda hesaplandığı için istemcide yamamak yarım bir sayfa üretirdi.
  const requested = (await searchParams)?.preset;
  const demoPreset: PortfolioPreset = PORTFOLIO_PRESETS.includes(requested as PortfolioPreset)
    ? (requested as PortfolioPreset)
    : "studio";
  const portfolio = await fetchPortfolio(slug, demoPreset);
  if (!portfolio) notFound();
  const { content, updatedAt } = portfolio;

  // Onaylı müşteri yorumları ("Wall of Love"). RLS approved-or-own → anon onaylıları okur.
  // Demo'da DB sorgusu yok — sabit örnek yorumlar (portfolio.userId gerçek değil).
  let testimonials: { id: string; author_name: string; author_role: string | null; quote: string }[] = DEMO_TESTIMONIALS;
  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data: testimonialRows } = await supabase
      .from("testimonials")
      .select("id, author_name, author_role, quote")
      .eq("user_id", portfolio.userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);
    testimonials = testimonialRows ?? [];
  }
  const { headline, bio, skills, projects, media, theme, layout } = content;
  // Sahibinin gizlediği öğeler public sayfada YOK (editörde durur, geri açılabilir).
  const projectGroups = visibleProjectGroups(media.projectGroups ?? []);
  const gallery = visibleGallery(media.gallery);
  const showProjectGroups = layout === "projects" && projectGroups.length > 0;
  const t = await getTranslations("portfolioPublic");
  // Tarih formatı ziyaretçi/UI diline bağlanır — görsel preset'e DEĞİL (atelier ≠ TR).
  const locale = await getLocale();
  // NOT: `layout` adı içerikte zaten kullanılıyor (gösterim modu) → tema düzeni `pf`.
  const { vars, dark, layout: pf } = portfolioTheme(theme.preset, theme.accent);
  // Preset'ler yalnız renkte değil RİTİMDE de ayrışır (ölçü, aralık, hiza, oran).
  const centred = pf.heroAlign === "center";
  const sectionCls = "mx-auto w-full px-6";
  const sectionStyle = { maxWidth: pf.maxWidth, paddingTop: pf.sectionGap / 3, paddingBottom: pf.sectionGap / 3 };
  const accentHex = ACCENT_HEX[theme.accent] ?? ACCENT_HEX.blue;

  // İletişim/işe-al hedefi: e-posta öncelikli (mailto), yoksa http(s) link. İkisi de yoksa CTA gizli.
  // Render'da defense-in-depth: yalnız geçerli e-posta / http(s) URL kabul (javascript: vb. engellenir).
  const contactEmail = validateContactEmail(content.contactEmail);
  const contactUrl = validateContactUrl(content.contactUrl);
  const contactHref = contactEmail ? `mailto:${contactEmail}` : contactUrl;

  // NOT: inline style'da GERÇEK boşluk şart — Tailwind-arbitrary `_` yerine değil.
  // `color-mix(in_srgb,...)` ham CSS'te geçersizdir (in_srgb token'ı) → deklarasyon
  // reddedilir ve vurgu arka planı public sayfada hiç render olmaz.
  const accentTint = "color-mix(in srgb, var(--pf-accent) 12%, transparent)";
  const heading = { fontFamily: "var(--pf-heading-font)" };

  // schema.org Person JSON-LD (SEO + zengin paylaşım önizlemesi).
  const base = await getBaseUrl();
  const jsonLd = buildPersonJsonLd({
    name: headline, description: bio, skills, avatarUrl: media.avatarUrl, url: `${base}/p/${slug}`,
  });

  return (
    <div
      // id: demo tema değiştirici bu elemanın CSS değişkenlerini override eder.
      id="pf-root"
      className={`${archivo.variable} ${spaceGrotesk.variable} ${fraunces.variable} min-h-dvh bg-[var(--pf-bg)] text-[var(--pf-text)] selection:bg-[var(--pf-accent)] selection:text-white`}
      style={{ ...vars, fontFamily: "var(--pf-body-font)" }}
    >
      {/* schema.org Person yapısal veri */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Demo bandı: dürüstlük + dönüşüm (yalnız /p/demo) */}
      {isDemo && (
        <a
          href={`${SITE_URL}/signup?ref=portfolio-demo`}
          className="flex items-center justify-center gap-2 bg-[var(--pf-accent)] px-4 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("demoRibbon")}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Üst vurgu şeridi */}
      <div className="h-1 w-full bg-[var(--pf-accent)]" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header
        className={`mx-auto w-full px-6 pt-14 sm:pt-24 ${centred ? "text-center" : ""}`}
        style={{ maxWidth: pf.maxWidth, paddingBottom: pf.sectionGap / 2 }}
      >
        <div className={`flex flex-col gap-6 sm:gap-8 ${centred ? "items-center" : "items-start"}`}>
          {media.avatarUrl ? (
            // Dış görsel (bağlı platformdan). Tıklanınca lightbox'ta büyür (ZoomableImage).
            <ZoomableImage
              src={media.avatarUrl}
              alt={headline}
              className="anim-fade-in anim-d0 h-24 w-24 sm:h-28 sm:w-28 object-cover ring-1 ring-[var(--pf-border)] shadow-xl rounded-[var(--pf-avatar-radius)]"
            />
          ) : (
            // Avatar yoksa (yalnız Bionluk/LinkedIn foto verir) baş-harfli çapa —
            // hero görsel kimlik hissini korur.
            <div
              aria-hidden
              className="anim-fade-in anim-d0 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center text-4xl font-bold text-white shadow-xl ring-1 ring-[var(--pf-border)] rounded-[var(--pf-avatar-radius)]"
              style={{ backgroundColor: "var(--pf-accent)" }}
            >
              {(headline.trim()[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div className={`space-y-4 ${centred ? "flex flex-col items-center" : ""}`}>
            <h1
              // Başlık ölçeği preset'ten gelir — üç preset üç farklı okuma ritmi.
              style={{ ...heading, fontSize: "var(--pf-h1)", maxWidth: "22ch" }}
              className="anim-fade-up anim-d1 font-bold tracking-tight leading-[1.05]"
            >
              {headline}
            </h1>
            {skills.length > 0 && (
              <div className={`anim-fade-up anim-d2 flex flex-wrap gap-2 ${centred ? "justify-center" : ""}`}>
                {skills.slice(0, 12).map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1 text-sm font-medium text-[var(--pf-accent)]"
                    style={{ backgroundColor: accentTint }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            <div className="anim-fade-up anim-d3 flex flex-wrap items-center gap-3">
              {contactHref && (
                <a
                  href={contactHref}
                  {...(contactUrl && !contactEmail ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pf-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  {t("hireCta")}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              {/* PDF sürümü — seçilebilir-metinli, paylaşılabilir (AI/kredi yok). Demo'da yok. */}
              {!isDemo && (
                <a
                  href={`/api/portfolio/export?slug=${encodeURIComponent(slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] px-5 py-2.5 text-sm font-semibold text-[var(--pf-text)] transition-colors hover:bg-[var(--pf-surface)]"
                >
                  <Download className="h-4 w-4" />
                  {t("downloadPdf")}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Görseller: "projects" modu = proje-proje kart+modal; aksi = düz galeri ── */}
      {showProjectGroups ? (
        <section className={sectionCls} style={sectionStyle}>
          <SectionLabel style={heading}>{t("projects")}</SectionLabel>
          {/* Karta tıklanınca Upwork tarzı proje detay modalı (rol/açıklama/beceriler/görseller). */}
          <div className="mt-5">
            {/* vars modala aktarılır: modal body'ye portallandığından --pf-* değişkenleri
                ancak portal kök'üne uygulanınca çözülür (aksi halde stilsiz görünür). */}
            <ProjectShowcase projects={projectGroups} fallbackAlt={headline} themeVars={vars} />
          </div>
        </section>
      ) : gallery.length > 0 ? (
        <section className={sectionCls} style={sectionStyle}>
          <SectionLabel style={heading}>{t("gallery")}</SectionLabel>
          {/* Tıklanınca lightbox + foto arası ileri/geri (PublicGallery, client). */}
          <PublicGallery images={gallery} fallbackAlt={headline} />
        </section>
      ) : null}

      {/* ── Canlı demo (opsiyonel gömme; SADECE allowlist host'lar güvenli iframe) ── */}
      {(() => {
        const embed = getSafeEmbed(content.embedUrl);
        if (!embed) return null;
        return (
          <section className={sectionCls} style={sectionStyle}>
            <SectionLabel style={heading}>{t("liveDemo")}</SectionLabel>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)]">
              <iframe
                src={embed.src}
                title={t("liveDemo")}
                loading="lazy"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-full w-full"
              />
            </div>
          </section>
        );
      })()}

      {/* ── Hakkında ─────────────────────────────────────────────────── */}
      <section className={sectionCls} style={sectionStyle}>
        <SectionLabel style={heading}>{t("about")}</SectionLabel>
        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-[var(--pf-text)]/90">{bio}</p>
      </section>

      {/* ── Projeler (AI metin kartları) ─────────────────────────────────
          "projects" gösterim modunda üstteki görsel showcase zaten zengin proje
          kartlarını (rol/açıklama/beceri/görsel) gösterir → yinelenmeyi önlemek için
          bu metin bölümü yalnız galeri modunda render edilir. */}
      {projects.length > 0 && !showProjectGroups && (
        <section className={sectionCls} style={sectionStyle}>
          <SectionLabel style={heading}>{t("projects")}</SectionLabel>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {projects.map((project, i) => {
              // KANIT ÖNCE: sonuç satırı işe alma kararını veren cümledir, bu yüzden
              // kartın en üstünde ve vurgu renginde durur; başlık/açıklama onu izler.
              const inner = (
                <>
                  {project.result && (
                    <div className="mb-3 border-b border-[var(--pf-border)] pb-3">
                      <span
                        className="block text-[11px] font-semibold text-[var(--pf-accent)]"
                        style={{ textTransform: "var(--pf-eyebrow-case)" as never, letterSpacing: "var(--pf-eyebrow-track)" }}
                      >
                        {t("caseResult")}
                      </span>
                      <p className="mt-1 font-semibold leading-snug text-[var(--pf-text)]" style={{ ...heading, fontSize: "var(--pf-h2)" }}>
                        {project.result}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <h3 style={heading} className="text-lg font-semibold leading-snug">{project.title}</h3>
                    {project.url && (
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--pf-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pf-muted)]">{project.description}</p>
                  {(project.problem || project.solution) && (
                    <dl className="mt-3 space-y-2 border-t border-[var(--pf-border)] pt-3 text-xs">
                      {project.problem && (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-[var(--pf-muted)]">{t("caseProblem")}</dt>
                          <dd className="mt-0.5 leading-relaxed text-[var(--pf-text)]">{project.problem}</dd>
                        </div>
                      )}
                      {project.solution && (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-[var(--pf-muted)]">{t("caseSolution")}</dt>
                          <dd className="mt-0.5 leading-relaxed text-[var(--pf-text)]">{project.solution}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </>
              );
              const cls =
                "anim-fade-up block block border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 transition-colors hover:border-[var(--pf-accent)] rounded-[var(--pf-radius)]";
              return project.url ? (
                <a
                  key={i}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cls} group`}
                  style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                >
                  {inner}
                </a>
              ) : (
                <div key={i} className={`${cls} group`} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Müşteri yorumları ("Wall of Love") — yalnız onaylılar ──────── */}
      {testimonials.length > 0 && (
        <section className={sectionCls} style={sectionStyle}>
          <SectionLabel style={heading}>{t("testimonials")}</SectionLabel>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {testimonials.map((tm) => (
              <figure key={tm.id} className="border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 rounded-[var(--pf-radius)]">
                <blockquote className="text-sm leading-relaxed text-[var(--pf-text)]">“{tm.quote}”</blockquote>
                <figcaption className="mt-3 text-xs font-semibold text-[var(--pf-muted)]">
                  {tm.author_name}{tm.author_role ? <span className="font-normal"> · {tm.author_role}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ── İletişim / işe-al CTA bölümü ─────────────────────────────── */}
      {contactHref && (
        <section className={sectionCls} style={sectionStyle}>
          <div
            className="anim-fade-up rounded-3xl border border-[var(--pf-border)] p-8 text-center sm:p-10"
            style={{ backgroundColor: accentTint }}
          >
            <h2 style={heading} className="text-2xl font-bold sm:text-3xl">{t("hireHeading")}</h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--pf-muted)]">{t("hireBody")}</p>
            <a
              href={contactHref}
              {...(contactUrl && !contactEmail ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--pf-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {t("hireCta")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      {/* ── İşe al: lead formu (yayınlanan portfolyolarda). Demo'da → "kendininkini kur" CTA. ── */}
      {isDemo ? (
        <section className={sectionCls} style={sectionStyle}>
          <div className="anim-fade-up rounded-3xl border border-[var(--pf-border)] p-8 text-center sm:p-10" style={{ backgroundColor: accentTint }}>
            <h2 style={heading} className="text-2xl font-bold sm:text-3xl">{t("demoCtaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--pf-muted)]">{t("demoCtaBody")}</p>
            <a
              href={`${SITE_URL}/signup?ref=portfolio-demo`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--pf-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {t("demoCtaButton")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      ) : (
        <section className={sectionCls} style={sectionStyle}>
          <div className="anim-fade-up rounded-3xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6 sm:p-8">
            <SectionLabel style={heading}>{t("leadEyebrow")}</SectionLabel>
            <h2 style={heading} className="mt-2 text-2xl font-bold">{t("leadHeading")}</h2>
            <p className="mt-2 text-[var(--pf-muted)]">{t("leadBody")}</p>
            <div className="mt-6">
              <LeadForm slug={slug} accentHex={accentHex} />
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className={sectionCls} style={{ maxWidth: pf.maxWidth, paddingBottom: 64, paddingTop: 40 }}>
        <div className="flex flex-col gap-2 border-t border-[var(--pf-border)] pt-6 text-xs text-[var(--pf-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t("lastUpdated")}: {new Date(updatedAt).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium hover:text-[var(--pf-accent)] transition-colors"
          >
            {t("madeWith")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </footer>

      {/* Koyu preset'te görsel kenar yumuşatma (arka planla kaynaşmasın) */}
      {dark && <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-px bg-white/5" />}

      {/* Tema değiştirici YALNIZ demo vitrininde — gerçek portfolyoda görünüm
          sahibinin kararıdır, ziyaretçi değiştiremez. */}
      {isDemo && <DemoThemeSwitcher initialPreset={theme.preset} />}
    </div>
  );
}

// Vurgu renkli küçük bölüm etiketi (eyebrow).
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2
      // Etiket biçimi preset'ten: studio/noir BÜYÜK HARF + geniş aralık, atelier cümle düzeni.
      style={{ ...style, textTransform: "var(--pf-eyebrow-case)" as never, letterSpacing: "var(--pf-eyebrow-track)" }}
      className="flex items-center gap-2 text-xs font-semibold text-[var(--pf-accent)]"
    >
      <span className="h-px w-6 bg-[var(--pf-accent)]" />
      {children}
    </h2>
  );
}
