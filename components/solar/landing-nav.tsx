"use client";

// Landing üst gezinmesinin mobil yarısı: hamburger + açılır sayfa-içi menü.
// Masaüstünde çapa linkleri doğrudan görünür (bu bileşen gizlenir).
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Asterisk, X } from "lucide-react";

const LINKS = [
  { key: "tools", href: "#tools" },
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
] as const;

/** Masaüstü çapa linkleri — mobilde gizli (.sp-toolnav). */
export function LandingNavLinks() {
  const t = useTranslations("siteChrome.nav");
  return (
    <nav className="sp-toolnav flex items-center gap-[26px]">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className="sp-label"
          style={{ color: "var(--text-strong)" }}
        >
          {t(l.key)}
        </Link>
      ))}
    </nav>
  );
}

/** Mobil hamburger + sheet — masaüstünde gizli (.sp-burger). */
export function LandingMobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("siteChrome");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sp-burger inline-grid h-10 w-10 cursor-pointer place-items-center rounded-[var(--radius-pill)] border-none"
        style={{ background: "var(--white)", boxShadow: "var(--shadow-soft)", color: "var(--text-strong)" }}
        aria-expanded={open}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={18} /> : <Asterisk size={18} />}
      </button>

      {open ? (
        <div className="sp-sheet relative z-[39] w-full px-0 pb-3">
          <div
            className="sp-rise grid gap-1 rounded-[var(--radius-sp-xl)] p-5"
            style={{ background: "var(--white)", boxShadow: "var(--shadow-lift)" }}
          >
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-0.5 py-3.5"
                style={{
                  borderBottom: "var(--border-hairline)",
                  font: "var(--fw-black) var(--fs-body-l)/1 var(--font-display)",
                  textTransform: "uppercase", letterSpacing: ".02em", color: "var(--text-strong)",
                }}
              >
                {t(`nav.${l.key}`)}
              </Link>
            ))}
            <div className="mt-3.5 grid gap-2.5">
              {isLoggedIn ? (
                <Link href="/dashboard" className="sp-btn sp-btn--block" onClick={() => setOpen(false)}>
                  {t("auth.dashboard")}
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="sp-btn sp-btn--block" onClick={() => setOpen(false)}>
                    {t("auth.startFreeLong")}
                  </Link>
                  <Link href="/login" className="sp-btn sp-btn--block sp-btn--ghost" onClick={() => setOpen(false)}>
                    {t("auth.login")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
