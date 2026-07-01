"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Sparkles, Briefcase, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS, PLATFORM_IDS } from "@/lib/ai/platforms";
import { ELEVATED, PLATFORM_STYLES } from "./shared";
import { useDashboard } from "./dashboard-context";

export function PlatformsHubTab({
  profileSaved, connections, jobsByPlatform,
}: {
  profileSaved: boolean;
  connections: Record<string, string>;
  jobsByPlatform: Record<string, number>;
}) {
  const t = useTranslations("platforms");
  const { adaptResults } = useDashboard();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
        <h2 className="text-2xl font-bold tracking-tight mt-1">{t("hubTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("hubSubtitle")}</p>
      </div>

      {!profileSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{t("card.saveProfileFirst")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_IDS.map((id) => {
          const style = PLATFORM_STYLES[id];
          const connected = !!connections[id];
          const adapted = !!adaptResults[id];
          const jobCount = jobsByPlatform[id] ?? 0;
          return (
            <Link key={id} href={`/dashboard/platforms/${id}`} className="group block">
              <Card className={`h-full shadow-sm overflow-hidden ${ELEVATED} hover:-translate-y-0.5 ${style.accent}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${style.icon}`}>
                      <PlatformLogo platform={id} size={20} />
                    </div>
                    <p className="text-sm font-semibold flex-1">{PLATFORMS[id].label}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {connected ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                        <CheckCircle2 className="h-3 w-3" />{t("card.connected")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] text-muted-foreground/60 px-1.5 py-0.5">
                        {t("card.notConnected")}
                      </span>
                    )}
                    {adapted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF]">
                        <Sparkles className="h-3 w-3" />{t("card.adapted")}
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Briefcase className="h-3 w-3 shrink-0" />{t("card.jobsCount", { count: jobCount })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
