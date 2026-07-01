"use client";

import { useTranslations } from "next-intl";
import { Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS, PLATFORM_IDS } from "@/lib/ai/platforms";
import { ELEVATED, PLATFORM_STYLES } from "./shared";
import { CopyButton } from "./copy-button";
import { useDashboard } from "./dashboard-context";
import { useAdapt } from "./use-adapt";

export function AdaptTab({ profileSaved }: { profileSaved: boolean }) {
  const t = useTranslations("adapt");
  const { adaptResults } = useDashboard();
  const { adapt, adapting, error: adaptError } = useAdapt();

  return (
    <div className="space-y-4">
      {!profileSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{t("saveProfileFirst")}
        </div>
      )}
      {adaptError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{adaptError}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_IDS.map((id) => {
          const style = PLATFORM_STYLES[id];
          const result = adaptResults[id];
          return (
            <Card key={id} className={`shadow-sm overflow-hidden ${ELEVATED} hover:-translate-y-0.5 ${style.accent}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.icon}`}>
                      <PlatformLogo platform={id} size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{PLATFORMS[id].label}</p>
                      {result && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>✓ {t("ready")}</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant={result ? "outline" : "default"}
                    onClick={() => adapt(id)} disabled={adapting === id || !profileSaved}
                    className="gap-1.5 h-7 text-xs shrink-0">
                    <Sparkles className="h-3 w-3" />
                    {adapting === id ? t("adapting") : result ? t("refresh") : t("adaptAction")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{result.headline}</p>
                      <CopyButton text={`${result.headline}\n\n${result.body}`} />
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {result.body}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/50 border border-dashed p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t("emptyState", { platform: PLATFORMS[id].label })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
