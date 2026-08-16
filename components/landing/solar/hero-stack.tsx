"use client";

// Hero'nun sağ paneli: TEK profil kaydı → altı çıktı. Çıktılar hap butonlarıyla
// seçilir, altındaki deste otomatik döner (arkadaki kartlar hafif açıyla taşar).
// `prefers-reduced-motion` açıksa döngü çalışmaz, ilk kart sabit kalır.
// Referans komp: docs/design/solar-pop/multifolio-landing-solar-pop.html (heroStack)
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Monitor, Package, Sun, Check, Flower2, Asterisk, type LucideIcon } from "lucide-react";
import { Blob } from "@/components/solar/primitives";
import { useReducedMotion } from "@/components/solar/use-reduced-motion";

const OUTPUT_IDS = ["linkedin", "upwork", "fiverr", "portfolio", "cv", "proposal"] as const;
type OutputId = (typeof OUTPUT_IDS)[number];

const OUTPUT_STYLE: Record<OutputId, { icon: LucideIcon; tint: string; ink: string }> = {
  linkedin:  { icon: Globe,   tint: "var(--peach-200)", ink: "var(--flame-600)" },
  upwork:    { icon: Monitor, tint: "var(--pink-200)",  ink: "var(--pink-600)" },
  fiverr:    { icon: Package, tint: "var(--amber-200)", ink: "var(--flame-600)" },
  portfolio: { icon: Sun,     tint: "var(--pink-100)",  ink: "var(--pink-600)" },
  cv:        { icon: Check,   tint: "var(--peach-100)", ink: "var(--flame-600)" },
  proposal:  { icon: Flower2, tint: "var(--cream-300)", ink: "var(--flame-600)" },
};

const ROTATE_MS = 3000;

export function HeroStack() {
  const t = useTranslations("landing.sp.hero");
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  // Kullanıcı bir hapa dokunduysa otomatik dönüşü durdur (kontrolü ondan alma).
  const pinned = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (!pinned.current) setActive((a) => (a + 1) % OUTPUT_IDS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const current = OUTPUT_IDS[active];

  return (
    <div className="relative min-w-0">
      <Blob size={200} color="var(--pink-200)" shape="petal" rotate={22} style={{ position: "absolute", right: -46, top: -44, zIndex: 0 }} />

      <div
        className="relative z-[2] grid gap-[18px] rounded-[var(--radius-sp-xl)] p-[26px]"
        style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-soft)" }}
      >
        {/* Kimlik: tek kayıt */}
        <div className="flex items-center gap-3.5">
          <span
            className="inline-grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[var(--radius-pill)]"
            style={{ background: "var(--action-primary)", color: "var(--white)", font: "var(--fw-black) 18px/1 var(--font-display)" }}
          >
            AK
          </span>
          <span className="mr-auto grid min-w-0 gap-[3px]">
            <span
              className="whitespace-nowrap"
              style={{
                font: "var(--fw-black) 18px/1.1 var(--font-display)",
                textTransform: "uppercase", letterSpacing: "var(--tracking-display)", color: "var(--text-strong)",
              }}
            >
              {t("sampleName")}
            </span>
            <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("sampleRole")}</span>
          </span>
          <span className="grid justify-items-end gap-px">
            <span style={{ font: "var(--fw-black) 30px/1 var(--font-display)", color: "var(--text-heading)" }}>1</span>
            <span className="sp-label whitespace-nowrap sp-label--muted">{t("profileIn")}</span>
          </span>
        </div>

        <div className="h-px" style={{ background: "var(--divider)" }} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="sp-label sp-label--pink">{t("outputsOut")}</span>
          <span
            className="whitespace-nowrap"
            style={{ font: "var(--fw-medium) var(--fs-label)/1 var(--font-body)", color: "var(--text-muted)" }}
          >
            {t("tapOne")}
          </span>
        </div>

        {/* Çıktı hapları */}
        <div className="flex flex-wrap gap-2">
          {OUTPUT_IDS.map((id, i) => {
            const on = i === active;
            const Icon = OUTPUT_STYLE[id].icon;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => { pinned.current = true; setActive(i); }}
                className="sp-chip"
                style={on
                  ? { background: OUTPUT_STYLE[id].ink, color: "var(--white)", boxShadow: "var(--shadow-soft)", transform: "translateY(-2px)" }
                  : { background: "var(--surface-page)" }}
              >
                <Icon size={13} />
                {t(`outputs.${id}.name`)}
              </button>
            );
          })}
        </div>

        {/* Deste: aktif kart önde, arkadakiler hafif açıyla taşar */}
        <div className="relative grid overflow-hidden px-2.5 pb-3.5">
          {OUTPUT_IDS.map((id, i) => {
            const rel = (i - active + OUTPUT_IDS.length) % OUTPUT_IDS.length;
            const on = rel === 0;
            const depth = Math.min(rel, 2);
            const Icon = OUTPUT_STYLE[id].icon;
            return (
              <div
                key={id}
                aria-hidden={on ? undefined : true}
                className="grid content-start gap-3"
                style={{
                  gridArea: "1 / 1",
                  position: on ? "relative" : "absolute",
                  inset: on ? undefined : "0 10px auto 10px",
                  height: on ? undefined : "100%",
                  minHeight: 158,
                  padding: 22,
                  borderRadius: "var(--radius-sp-lg)",
                  background: on ? "var(--white)" : OUTPUT_STYLE[id].tint,
                  boxShadow: on ? "var(--shadow-lift)" : "var(--shadow-soft)",
                  transform: on ? "none" : `rotate(${depth * (i % 2 ? -1.6 : 1.8)}deg) translateY(${depth * 7}px)`,
                  opacity: on ? 1 : depth > 1 ? 0 : 1,
                  zIndex: 10 - depth,
                  pointerEvents: on ? "auto" : "none",
                  transition: reduced
                    ? "none"
                    : "transform var(--dur-slow) var(--ease-pop), opacity var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
                }}
              >
                {on ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-pill)]"
                        style={{ background: OUTPUT_STYLE[id].tint, color: OUTPUT_STYLE[id].ink }}
                      >
                        <Icon size={15} />
                      </span>
                      <span
                        style={{
                          font: "var(--fw-black) 15px/1 var(--font-display)",
                          textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-strong)",
                        }}
                      >
                        {t(`outputs.${id}.name`)}
                      </span>
                      <span
                        className="sp-label ml-auto whitespace-nowrap rounded-[var(--radius-pill)] px-[11px] py-1.5"
                        style={{ background: "var(--surface-page)", color: "var(--text-muted)", letterSpacing: ".08em" }}
                      >
                        {t(`outputs.${id}.cost`)}
                      </span>
                    </div>
                    <p style={{ font: "var(--fw-medium) var(--fs-body)/1.6 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>
                      {t(`outputs.${id}.line`)}
                    </p>
                    <span className="sp-label mt-auto inline-flex items-center gap-2 sp-label--muted" style={{ letterSpacing: ".06em" }}>
                      <Asterisk size={12} />
                      {t(`outputs.${id}.meta`)}
                    </span>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{t(`outputs.${current}.name`)}</span>
    </div>
  );
}
