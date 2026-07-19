"use client";

// Spotlight overlay — ekranı soluklaştırır, tek hedefi parlatır, YALNIZ parlak yer
// tıklanabilir. Hedef 4 soluk panelin ortasında açıkta kalır (gerisi panellerce
// kapatılır → başka yere tıklanamaz). Hedef rect'i her karede (rAF) okunur →
// scroll/resize/iç-kolon kaymalarına dayanıklı. Hedef bulunamazsa tooltip ortalanır
// (takılma yok). Portal ile body'ye render; yalnız tur aktifken.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, ArrowLeft, ArrowRight, Sparkles, MousePointerClick } from "lucide-react";
import { useTour } from "./tour-context";

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8;            // hedef çevresi boşluk (px)
const FALLBACK_MS = 1600; // doğru path'te hedef bu süre içinde bulunamazsa ortala
const TT_W = 340;         // tooltip genişliği (px; viewport dar ise kısılır)

// Görünür (genişlik/yükseklik > 0) ilk data-tour eşleşmesini bulur.
// (Nav linki hem desktop sidebar hem mobil şeritte var; gizli olan 0 boyut döner.)
function findVisibleTarget(sel: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${sel}"]`);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

// Tooltip balonu — render İÇİNDE bileşen yaratmamak için modül düzeyinde (lint:
// react-hooks/static-components). Konumu `style` (spotlight) veya `atCenter` ile gelir.
function TourTooltip({
  stepId, optional, isClickStep, isLast, stepIndex, total, centered, showNextBtn,
  style, atCenter, onSkip, onNext, onBack,
}: {
  stepId: string;
  optional: boolean;
  isClickStep: boolean;
  isLast: boolean;
  stepIndex: number;
  total: number;
  centered: boolean;
  showNextBtn: boolean;
  style?: React.CSSProperties;
  atCenter?: boolean;
  onSkip: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("tour");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(`steps.${stepId}.title`)}
      style={style}
      className={`pointer-events-auto ${atCenter ? "" : "fixed"} z-[102] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-[#00F0FF]/25 bg-popover text-popover-foreground shadow-2xl shadow-black/40 ring-1 ring-black/5`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00F0FF]/12 text-[#00F0FF]">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold leading-snug">{t(`steps.${stepId}.title`)}</h3>
          </div>
          <button
            onClick={onSkip}
            title={t("skipTour")}
            aria-label={t("skipTour")}
            className="shrink-0 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{t(`steps.${stepId}.body`)}</p>

        {/* Tıklama adımı ipucu (fallback değilse) */}
        {isClickStep && !centered && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#00F0FF]">
            <MousePointerClick className="h-3.5 w-3.5" />{t("clickHint")}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground/70">
            {t("progress", { current: stepIndex + 1, total })}
          </span>
          <div className="flex items-center gap-1.5">
            {stepIndex > 0 && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />{t("back")}
              </button>
            )}
            {showNextBtn && (
              <button
                onClick={onNext}
                className="inline-flex items-center gap-1 rounded-lg bg-[#00F0FF] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#00F0FF]/90 transition-colors cursor-pointer"
              >
                {isLast ? t("finish") : t("next")}<ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Opsiyonel adım: "Bu adımı atla" ayrı satırda (footer'ı sıkıştırmasın) */}
        {optional && !centered && (
          <button
            onClick={onNext}
            className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {t("skipStep")}
          </button>
        )}
      </div>
    </div>
  );
}

export function TourOverlay() {
  const { active, step, stepIndex, total, next, back, skipTour } = useTour();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);
  const [fellBack, setFellBack] = useState(false);
  const [renderKey, setRenderKey] = useState("");
  const rafRef = useRef<number | null>(null);

  const targetSel = step?.target ?? null;
  const onPath = !step?.path || pathname === step.path;

  // Adım/path/hedef değişince izleme durumunu RENDER sırasında sıfırla — effect içinde
  // senkron setState yasak (react-hooks/set-state-in-effect); pool-job-panel deseni.
  const stepKey = active && step ? `${stepIndex}:${step.path ?? ""}:${targetSel ?? ""}` : "";
  if (renderKey !== stepKey) {
    setRenderKey(stepKey);
    setRect(null);
    setFellBack(false);
  }

  // Hedef rect takibi (rAF döngüsü — setState yalnız async callback'lerde).
  useEffect(() => {
    if (!active || !step || !targetSel || !onPath) return; // ortalı kart ya da navigasyon beklemesi

    let fallbackTimer: number | null = window.setTimeout(() => setFellBack(true), FALLBACK_MS);
    let scrolled = false;

    const tick = () => {
      const el = findVisibleTarget(targetSel);
      if (el) {
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        setFellBack(false);
        if (!scrolled) {
          const r0 = el.getBoundingClientRect();
          if (r0.top < 0 || r0.bottom > window.innerHeight) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [active, step, targetSel, onPath]);

  // advance:"click" → parlak hedefe tıklayınca ilerle (capture fazı: navigasyondan önce).
  useEffect(() => {
    if (!active || !step || step.advance !== "click" || !targetSel) return;
    const handler = (e: MouseEvent) => {
      const el = findVisibleTarget(targetSel);
      if (el && e.target instanceof Node && el.contains(e.target)) next();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [active, step, targetSel, next]);

  // Esc = turu geç.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skipTour(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skipTour]);

  const isLast = stepIndex === total - 1;
  const showSpotlight = onPath && !!targetSel && !!rect && !fellBack;
  // Ortalı kart: hedefsiz adım VEYA doğru path'te hedef bulunamadı (fallback).
  const centered = onPath && (!targetSel || fellBack);
  // Fallback'te tıklama imkânsız → "İleri" göster; aksi halde adım tipine göre.
  const showNextBtn = step ? (step.advance === "next" || centered) : false;

  // active SSR/hydration'da false → portal yalnız client'ta (document var) açılır.
  if (!active || !step || typeof document === "undefined") return null;

  // Tooltip'i ortak proplarla üretir (spotlight ve ortalı kart aynı bileşeni paylaşır).
  const tooltip = (style?: React.CSSProperties, atCenter?: boolean) => (
    <TourTooltip
      stepId={step.id}
      optional={!!step.optional}
      isClickStep={step.advance === "click"}
      isLast={isLast}
      stepIndex={stepIndex}
      total={total}
      centered={centered}
      showNextBtn={showNextBtn}
      style={style}
      atCenter={atCenter}
      onSkip={skipTour}
      onNext={next}
      onBack={back}
    />
  );

  // Spotlight geometrisi.
  let content: React.ReactNode;
  if (showSpotlight && rect) {
    const hole = {
      top: Math.max(0, rect.top - PAD),
      left: Math.max(0, rect.left - PAD),
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const holeBottom = hole.top + hole.height;
    const holeRight = hole.left + hole.width;
    const centerX = hole.left + hole.width / 2;
    // Tooltip'i hedefin altına, sığmazsa üstüne koy; yatayda hizala + kenara sıkıştırma.
    const placeBelow = holeBottom + 200 < vh || hole.top < 200;
    const ttW = Math.min(TT_W, vw - 32);
    const ttLeft = Math.min(Math.max(centerX - ttW / 2, 16), vw - ttW - 16);
    const ttStyle: React.CSSProperties = placeBelow
      ? { top: holeBottom + 12, left: ttLeft }
      : { bottom: vh - hole.top + 12, left: ttLeft };

    const panel = "fixed bg-black/70 pointer-events-auto";
    content = (
      <>
        {/* 4 soluk panel — hedef ortada açıkta kalır */}
        <div className={panel} style={{ top: 0, left: 0, width: "100%", height: hole.top }} />
        <div className={panel} style={{ top: holeBottom, left: 0, width: "100%", bottom: 0 }} />
        <div className={panel} style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
        <div className={panel} style={{ top: hole.top, left: holeRight, right: 0, height: hole.height }} />
        {/* Parlak nabız halkası (hedef çevresi) */}
        <div
          aria-hidden
          className="fixed pointer-events-none rounded-xl border-2 border-[#00F0FF] shadow-[0_0_0_4px_rgba(0,240,255,0.35),0_0_32px_10px_rgba(0,240,255,0.30)] animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        />
        {tooltip(ttStyle)}
      </>
    );
  } else if (centered) {
    content = (
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto bg-black/70">
        {tooltip(undefined, true)}
      </div>
    );
  } else {
    // Navigasyon/render beklemesi → yalnız soluk arka plan (kısa süreli).
    content = <div className="fixed inset-0 bg-black/70 pointer-events-auto" />;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">{content}</div>,
    document.body,
  );
}
