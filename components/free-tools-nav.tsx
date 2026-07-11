"use client";

// Masaüstü üst nav'da "Free Tools" açılır menüsü — araç linklerini tek bir menüde
// toplar (bar kalabalıklığını azaltır). Hover + tıklama açar; dışa tık / Escape kapatır.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FreeToolsNav({
  label, items,
}: {
  label: string;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
        >
          <div className="min-w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161923] shadow-xl shadow-black/10 dark:shadow-black/40 p-1.5">
            {items.map(({ label: l, href }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
