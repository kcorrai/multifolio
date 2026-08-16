"use client";

// SSS akordeonu — tek açık öğe. Kapalı öğeler krem, açık öğe beyaz + yumuşak
// gölge; glif hap hover/açılışta -8° döner (design system'in imza hareketi).
// Cevaplar DOM'da yalnız açıkken bulunur; SEO için soru metinleri her zaman var
// ve sayfa JSON-LD'si tam soru/cevap çiftini ayrıca yayınlar.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, X } from "lucide-react";

const FAQ_IDS = ["credit", "subscription", "checkout", "invent", "detect"] as const;

export function FaqAccordion() {
  const t = useTranslations("landing.sp.faq");
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="grid gap-3">
      {FAQ_IDS.map((id, i) => {
        const isOpen = open === i;
        return (
          <div
            key={id}
            className="overflow-hidden rounded-[var(--radius-sp-lg)]"
            style={{
              background: isOpen ? "var(--white)" : "var(--surface-card)",
              boxShadow: isOpen ? "var(--shadow-soft)" : "none",
              transition: "background var(--dur-base) var(--ease-out)",
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-3.5 border-none bg-transparent px-[22px] py-[19px] text-left"
              style={{
                font: "var(--fw-black) var(--fs-body-l)/1.3 var(--font-display)",
                textTransform: "uppercase", letterSpacing: ".01em", color: "var(--text-strong)",
              }}
            >
              {t(`q.${id}`)}
              <span
                className="inline-grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-pill)]"
                style={{
                  background: isOpen ? "var(--flame-500)" : "var(--pink-200)",
                  color: isOpen ? "var(--white)" : "var(--pink-600)",
                  transform: isOpen ? "rotate(-8deg)" : "none",
                  transition: "all var(--dur-base) var(--ease-pop)",
                }}
              >
                {isOpen ? <X size={14} /> : <ArrowRight size={14} />}
              </span>
            </button>
            {isOpen ? (
              <p className="sp-in sp-body px-[22px] pb-5" style={{ lineHeight: 1.7 }}>{t(`a.${id}`)}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
