/* Landing vitrin bölümleri için cilalı "uygulama penceresi" çerçevesi (sunucu bileşeni).
   Pencere chrome'u (trafik ışığı noktaları + URL çubuğu) + içerik slotu. Dashboard'a
   benzeyen mockup'lar bunun içine konur. Tamamen statik; JS yok. */
import type { ReactNode } from "react";

export function BrowserFrame({
  url,
  children,
  className = "",
  toolbar,
}: {
  url: string;
  children: ReactNode;
  className?: string;
  /* URL çubuğunun sağına küçük bir aksiyon/etiket (opsiyonel). */
  toolbar?: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#12141c] dark:shadow-black/40 ${className}`}
    >
      {/* Pencere çubuğu */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/8 dark:bg-white/[0.03]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70 dark:bg-red-500/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70 dark:bg-amber-500/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70 dark:bg-emerald-500/50" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-400 dark:bg-white/[0.05] dark:text-white/40">
          {url}
        </span>
        {toolbar}
      </div>
      {/* İçerik */}
      <div className="relative">{children}</div>
    </div>
  );
}
