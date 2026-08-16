// Solar Pop site kabuğu — marka, üst gezinme ve footer. Landing, ücretsiz araç
// sayfaları ve (sırası gelince) diğer public sayfalar bunu paylaşır.
// SUNUCU bileşenleri; mobil menü ayrı client parçasıdır (landing-nav.tsx).
// Referans komplar: docs/design/solar-pop/multifolio-{landing,free-tools}-solar-pop.html
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sun } from "lucide-react";

/* ─── Marka ─────────────────────────────────────────────────────────────
   Logo dosyası YOK — marka tipografiyle kurulur (design system "do not draw
   a mark" diyor): alev renkli hap içinde "m" + büyük harf wordmark. */
export function Wordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  const disc = size === "lg" ? 34 : 30;
  return (
    <span className="flex items-center gap-[11px]">
      <span
        className="inline-grid shrink-0 place-items-center rounded-[var(--radius-pill)]"
        style={{
          width: disc, height: disc, background: "var(--action-primary)", color: "var(--white)",
          font: `var(--fw-black) ${size === "lg" ? 16 : 14}px/1 var(--font-display)`,
        }}
      >
        m
      </span>
      <span
        style={{
          font: `var(--fw-black) ${size === "lg" ? 19 : 16}px/1 var(--font-display)`,
          letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
        }}
      >
        multifolio
      </span>
    </span>
  );
}

/* ─── Auth aksiyonları ──────────────────────────────────────────────────
   Girişli kullanıcı kredi bakiyesini burada görür (kredi her yerde birinci
   sınıf kavram); kayıtsız kullanıcı iki CTA görür. */
export async function HeaderAuth({ isLoggedIn, credits }: { isLoggedIn: boolean; credits?: number }) {
  const t = await getTranslations("siteChrome.auth");

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        {typeof credits === "number" ? (
          <span className="sp-chip sp-chip--static">
            <Sun size={13} />
            {t("credits", { count: credits })}
          </span>
        ) : null}
        <Link href="/dashboard" className="sp-btn sp-btn--sm">{t("dashboard")}</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="sp-btn sp-btn--sm sp-btn--ghost">{t("login")}</Link>
      <Link href="/signup" className="sp-btn sp-btn--sm">{t("startFree")}</Link>
    </div>
  );
}

/* ─── Header kabuğu ─────────────────────────────────────────────────────
   `nav` slot'u çağırana bırakılır: landing çapa linkleri, araç sayfaları
   araç hapları koyar. Sabit/yapışkan DEĞİL — design system'de nav sayfayla
   birlikte kayar. */
export function SolarHeader({ nav, actions }: { nav?: ReactNode; actions: ReactNode }) {
  return (
    <header className="sp-toolhead relative z-40 mx-auto flex w-full max-w-[var(--page-max)] flex-wrap items-center gap-x-7 gap-y-3 px-6 py-[22px]">
      <Link href="/" className="mr-auto">
        <Wordmark />
      </Link>
      {nav}
      {actions}
    </header>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────
   Tek footer, tüm public sayfalarda. Yalnız üstteki tanıtım cümlesi sayfa
   ailesine göre değişir (`blurb`). */
const FOOTER_COLS: { key: string; links: { key: string; href: string }[] }[] = [
  {
    key: "product",
    links: [
      { key: "adapter", href: "/#features" },
      { key: "feed", href: "/#features" },
      { key: "proposals", href: "/#features" },
      { key: "portfolio", href: "/p/demo" },
      { key: "pipeline", href: "/#features" },
    ],
  },
  {
    key: "tools",
    links: [
      { key: "analyze", href: "/analyze" },
      { key: "rate", href: "/rate" },
      { key: "roi", href: "/roi" },
      { key: "ats", href: "/ats-check" },
      { key: "proposalChecker", href: "/proposal-checker" },
      { key: "headline", href: "/headline-optimizer" },
    ],
  },
  {
    key: "grow",
    links: [
      { key: "extension", href: "/extension/privacy" },
      { key: "guides", href: "/guides" },
      { key: "freelance", href: "/freelance" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "pricing", href: "/pricing" },
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
      { key: "contact", href: "/contact" },
    ],
  },
];

export async function SolarFooter({ blurb = "site" }: { blurb?: "site" | "tools" }) {
  const t = await getTranslations("siteChrome.footer");

  return (
    <footer className="sp-wrap pb-11">
      <div
        className="grid gap-8 pt-9"
        style={{ borderTop: "var(--border-hairline)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))" }}
      >
        <div className="grid content-start gap-3">
          <Wordmark size="sm" />
          <p className="sp-body sp-body--small" style={{ color: "var(--text-muted)", maxWidth: "28ch" }}>
            {t(`blurb.${blurb}`)}
          </p>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.key} className="grid content-start gap-[11px]">
            <span className="sp-label sp-label--pink">{t(`col.${col.key}`)}</span>
            {col.links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                style={{ font: "var(--fw-medium) var(--fs-body-s)/1.5 var(--font-body)", color: "var(--text-body)" }}
              >
                {t(`link.${l.key}`)}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div
        className="mt-7 flex flex-wrap justify-between gap-3 pt-[18px]"
        style={{ borderTop: "var(--border-hairline)" }}
      >
        <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("legalLine")}</span>
        <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("metaLine")}</span>
      </div>
    </footer>
  );
}

/* ─── Bölüm sarmalayıcı ─────────────────────────────────────────────────
   Landing tek 1240px kolondur; bölümler alt alta yığılır (sidebar yok,
   yapışkan öge yok — design system kuralı). */
export function SolarSection({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`sp-section ${className}`}>
      <div className="sp-wrap">{children}</div>
    </section>
  );
}

/** Bölüm başlığı: küçük pembe etiket + büyük harf başlık + el yazısı vurgu. */
export function SectionHeading({
  eyebrow, title, script, lede, onDark,
}: {
  eyebrow: string;
  title: string;
  script?: string;
  lede?: string;
  onDark?: boolean;
}) {
  return (
    <div className="grid gap-2.5" style={{ maxWidth: "54ch" }}>
      <span className="sp-label" style={{ color: onDark ? "var(--peach-200)" : "var(--pink-600)" }}>{eyebrow}</span>
      <h2 className="sp-h2" style={onDark ? { color: "var(--white)" } : undefined}>
        {title}{" "}
        {script ? (
          <span className="sp-script sp-script--lg" style={onDark ? { color: "var(--pink-300)" } : undefined}>
            {script}
          </span>
        ) : null}
      </h2>
      {lede ? (
        <p className="sp-body sp-body--lead" style={onDark ? { color: "rgba(255,255,255,.9)" } : undefined}>{lede}</p>
      ) : null}
    </div>
  );
}
