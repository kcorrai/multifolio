"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function useIsMounted() {
  return useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false,
  );
}

export function ThemeToggle({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const t = useTranslations("common");

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={resolvedTheme === "dark" ? t("switchToLight") : t("switchToDark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
