"use client";

// Sağdan kayan detay paneli: arka plan kararır, ESC/backdrop kapatır,
// açıkken body scroll kilitlenir. İçerik (children) panelin tamamını doldurur.
import { useEffect, type ReactNode } from "react";

export function JobSlideOver({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in-0 duration-200 motion-reduce:animate-none"
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300 ease-out motion-reduce:animate-none">
        {children}
      </div>
    </div>
  );
}
