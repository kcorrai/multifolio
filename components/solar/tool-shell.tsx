// Ücretsiz araç sayfalarının Solar Pop kabuğu (SUNUCU bileşeni):
// header (logo + araç nav'ı + auth) → hero (bayrak/başlık/lede) → içerik →
// çapraz-link paneli → footer. Altı araç sayfası da bunu sarmalar; hero ve
// footer kopyası i18n `tools.*` katalogundan gelir.
// Referans komp: docs/design/solar-pop/multifolio-free-tools-solar-pop.html
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sun, ArrowRight } from "lucide-react";
import { TOOLS, otherTools, type ToolId } from "@/lib/tools/catalog";
import { Blob, Blobs } from "./primitives";
import { SolarHeader, SolarFooter, HeaderAuth } from "./site-chrome";

/* ─── Header ────────────────────────────────────────────────────────────
   Marka/auth/footer paylaşılan site chrome'undan gelir; araç sayfalarına özel
   olan yalnız nav: altı aracın hap listesi, aktif olan ink dolgulu. */
async function ToolNav({ current }: { current: ToolId }) {
  const t = await getTranslations("tools");
  return (
    <nav className="sp-toolnav flex flex-wrap items-center gap-1.5">
      {TOOLS.map((tool) => (
        <Link
          key={tool.id}
          href={tool.href}
          aria-current={tool.id === current ? "page" : undefined}
          className={`sp-chip ${tool.id === current ? "sp-chip--on" : ""}`}
        >
          {t(`nav.${tool.id}`)}
        </Link>
      ))}
    </nav>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────
   Başlık = büyük harf display + tek el yazısı kelime (sistemin imzası). */
async function ToolHero({ tool, href }: { tool: ToolId; href: string }) {
  const t = await getTranslations("tools");
  const isServerTool = TOOLS.find((x) => x.id === tool)?.server;

  return (
    <section className="relative pb-10 pt-5">
      <Blobs>
        <Blob size={280} color="var(--peach-200)" shape="blob" opacity={0.7} style={{ right: -110, top: -80 }} />
        <Blob size={120} color="var(--pink-300)" shape="circle" opacity={0.6} style={{ left: -50, bottom: -30 }} />
      </Blobs>

      <div className="sp-wrap relative z-[2] grid justify-items-start gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="sp-chip sp-chip--static">
            <Sun size={13} />
            {isServerTool ? t("flagLimited") : t("flagFree")}
          </span>
          <span
            style={{ font: "var(--fw-medium) var(--fs-label)/1 var(--font-body)", color: "var(--ink-700)" }}
          >
            multifolio.app{href}
          </span>
        </div>

        <h1 className="sp-h1" style={{ maxWidth: "22ch" }}>
          {t(`hero.${tool}.title`)} <span className="sp-script">{t(`hero.${tool}.script`)}</span>
        </h1>

        <p className="sp-body sp-body--lead" style={{ maxWidth: "62ch" }}>
          {t(`hero.${tool}.lede`)}
        </p>
      </div>
    </section>
  );
}

/* ─── Çapraz-link paneli ────────────────────────────────────────────────
   Araçlar arası geçişi ve ürüne dönüşümü TEK yerde toplar; giriş yapmış
   kullanıcıya farklı konuşur (dönüşecek bir şey kalmadı, işi ürüne taşı). */
async function ToolCrossLink({ currentHref, isLoggedIn }: { currentHref: string; isLoggedIn: boolean }) {
  const t = await getTranslations("tools");
  const others = otherTools(currentHref);
  const k = isLoggedIn ? "in" : "out";

  return (
    <section className="pb-16 pt-5">
      <div className="sp-wrap">
        <div
          className="relative grid gap-[22px] overflow-hidden rounded-[var(--radius-sp-xl)] p-[30px]"
          style={{ background: "var(--surface-inverse)" }}
        >
          <Blobs>
            <Blob size={260} color="var(--flame-400)" shape="blob" style={{ right: -90, bottom: -90 }} />
          </Blobs>

          <div className="relative z-[2] grid gap-2.5" style={{ maxWidth: "52ch" }}>
            <span
              className="sp-label w-fit rounded-[var(--radius-pill)] px-3 py-1.5"
              style={{ background: "var(--ink-900)", color: "var(--white)" }}
            >
              {t(`cross.eyebrow.${k}`)}
            </span>
            <h2 className="sp-h2" style={{ color: "var(--white)" }}>{t(`cross.title.${k}`)}</h2>
          </div>

          <div className="sp-three relative z-[2]" style={{ gap: 16 }}>
            {others.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="grid min-w-0 gap-2.5 rounded-[var(--radius-sp-lg)] p-5 text-left"
                style={{ background: "var(--white)" }}
              >
                <span className="sp-chip sp-chip--static w-fit">{t("cross.freeBadge")}</span>
                <span
                  style={{
                    font: "var(--fw-black) var(--fs-body-l)/1.15 var(--font-display)",
                    letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
                  }}
                >
                  {t(`nav.${tool.id}`)}
                </span>
                <span className="sp-body sp-body--small">{t(`cross.blurb.${tool.id}`)}</span>
                <span className="sp-label inline-flex items-center gap-[7px]">
                  {t("cross.open")}
                  <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>

          <div
            className="relative z-[2] flex flex-wrap items-center gap-5 rounded-[var(--radius-sp-lg)] p-6"
            style={{ background: "rgba(255,255,255,.16)" }}
          >
            <div className="grid min-w-0 flex-[1_1_280px] gap-2">
              <span className="sp-title" style={{ color: "var(--white)" }}>{t(`cross.pitchTitle.${k}`)}</span>
              <span className="sp-body" style={{ color: "rgba(255,255,255,.9)" }}>{t(`cross.pitchBody.${k}`)}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="sp-btn sp-btn--quiet">
                    {t("cross.ctaDashboard")} <ArrowRight size={15} />
                  </Link>
                  <Link href="/pricing" className="sp-btn sp-btn--quiet">{t("cross.ctaCredits")}</Link>
                </>
              ) : (
                <>
                  <Link href={`/signup?ref=${currentHref.replace(/^\//, "")}`} className="sp-btn sp-btn--quiet">
                    {t("cross.ctaStart")} <ArrowRight size={15} />
                  </Link>
                  <Link href="/pricing" className="sp-btn sp-btn--quiet">{t("cross.ctaPricing")}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Kabuk ─────────────────────────────────────────────────────────── */
export async function ToolShell({
  tool, href, isLoggedIn, children,
}: {
  tool: ToolId;
  href: string;
  isLoggedIn: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sp-page pb-20">
      <SolarHeader
        nav={<ToolNav current={tool} />}
        actions={<HeaderAuth isLoggedIn={isLoggedIn} />}
      />
      <main>
        <ToolHero tool={tool} href={href} />
        {children}
        <ToolCrossLink currentHref={href} isLoggedIn={isLoggedIn} />
      </main>
      <SolarFooter blurb="tools" />
    </div>
  );
}

/** Araç gövdesini saran ortak bölüm (kabuk ile aynı ölçü/ritim). */
export function ToolSection({ children }: { children: ReactNode }) {
  return (
    <section className="pb-14">
      <div className="sp-wrap grid gap-[22px]">{children}</div>
    </section>
  );
}
