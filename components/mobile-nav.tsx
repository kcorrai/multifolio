"use client";

// Mobil gezinme (client): landing/pricing header'ında md altında hamburger +
// açılır panel. Masaüstü nav ve auth butonları md:hidden ile mobilde gizlenip
// tüm linkler + toggle'lar + CTA'lar buraya taşınır (header taşması biter).
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

const LINKS = [
  { key: "nav.analyze",     href: "/analyze" },
  { key: "nav.earnings",    href: "/earnings" },
  { key: "nav.rate",        href: "/rate" },
  { key: "nav.proposalChecker", href: "/proposal-checker" },
  { key: "nav.compare",     href: "/compare" },
  // TR vergi rehberi yalnız Türk kullanıcılara (masaüstü nav ile aynı kural).
  { key: "nav.trTax",       href: "/vergi", trOnly: true },
  { key: "nav.pricing",     href: "/pricing" },
];

export function MobileNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const locale = useLocale();
  const links = LINKS.filter((l) => !l.trOnly || locale.startsWith("tr"));
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Açıkken Escape kapatır + arka plan kaydırması kilitlenir.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label={t("nav.openMenu")}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay body'ye portal edilir: header'ın stacking context'inde hapsolup
          hero'nun altında boyanmasını önler (z-50 güvenilir şekilde üstte kalır).
          Yalnız `open` (client tıklaması) sonrası render → SSR'de document sorunu yok. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="absolute inset-x-0 top-0 bg-white dark:bg-[#090A0F] border-b border-slate-200 dark:border-white/10 shadow-2xl px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg tracking-tight">Multifolio</span>
              <button
                onClick={close}
                aria-label={t("nav.closeMenu")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col">
              {links.map(({ key, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="py-3 text-base font-medium text-slate-700 dark:text-white/85 border-b border-slate-100 dark:border-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t(key)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 pt-4">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              {isLoggedIn ? (
                <Button asChild className="font-semibold bg-violet-600 hover:bg-violet-500 text-white">
                  <Link href="/dashboard" onClick={close}>{tc("dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="font-semibold">
                    <Link href="/login" onClick={close}>{t("cta.login")}</Link>
                  </Button>
                  <Button asChild className="font-semibold bg-violet-600 hover:bg-violet-500 text-white">
                    <Link href="/signup" onClick={close}>{t("cta.signupFree")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
