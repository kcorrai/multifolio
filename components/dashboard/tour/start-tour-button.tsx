"use client";

// Turu yeniden başlatan buton (getting-started hero'sunda). TourProvider içinde kullanılır.
import { useTranslations } from "next-intl";
import { PlayCircle } from "lucide-react";
import { useTour } from "./tour-context";

export function StartTourButton({ className }: { className?: string }) {
  const { start } = useTour();
  const t = useTranslations("tour");
  return (
    <button
      onClick={start}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-3 py-1.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF]/15 transition-colors cursor-pointer"
      }
    >
      <PlayCircle className="h-3.5 w-3.5" />
      {t("replay")}
    </button>
  );
}
