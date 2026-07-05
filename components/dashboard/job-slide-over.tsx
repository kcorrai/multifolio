"use client";

// Sağdan kayan detay paneli: arka plan kararır, ESC/backdrop kapatır,
// açıkken body scroll kilitlenir. İçerik (children) panelin tamamını doldurur.
// A11y: açılışta odak panele geçer, kapanışta tetikleyici öğeye döner, Tab
// panel içinde tuzaklanır (arka plana sekmeyle geçilemez).
import { useEffect, useRef, type ReactNode } from "react";

export function JobSlideOver({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Açılıştan önceki odaklı öğeyi sakla → kapanışta geri ver.
    const trigger = document.activeElement as HTMLElement | null;
    // Açılışta odağı panele taşı (ilk odaklanabilir öğe, yoksa panelin kendisi).
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? panel)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      trigger?.focus?.();
    };
  }, [onClose]);

  // Tab tuzağı: odak panelden çıkmasın (basit döngü).
  function onKeyDownTrap(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in-0 duration-200 motion-reduce:animate-none"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={onKeyDownTrap}
        className="absolute inset-y-0 right-0 w-full max-w-2xl border-l border-border bg-card shadow-2xl outline-none animate-in slide-in-from-right duration-300 ease-out motion-reduce:animate-none"
      >
        {children}
      </div>
    </div>
  );
}
