"use client";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setUserLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/detect";

// EN/TR dil değiştirici. Cookie'yi server action ile yazar, ardından yeniden render tetikler.
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = locale === "en" ? "tr" : "en";
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label="Toggle language"
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
    >
      <Languages className="h-3.5 w-3.5" />
      {locale.toUpperCase()}
    </button>
  );
}
