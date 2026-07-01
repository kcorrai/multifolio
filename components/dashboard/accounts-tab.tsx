"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save, ExternalLink, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import { ELEVATED, PLATFORM_STYLES, PLATFORM_URL_PLACEHOLDERS } from "./shared";
import { useDashboard } from "./dashboard-context";

export function AccountsTab({ initialConnections }: { initialConnections: Record<string, string> }) {
  const { setConnectionsCount } = useDashboard();
  const t = useTranslations("accounts");
  const [connections, setConnections] = useState<Record<string, string>>(initialConnections);
  const [connectionDraft, setConnectionDraft] = useState<Record<string, string>>(initialConnections);
  const [savingConnection, setSavingConnection] = useState<PlatformId | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<PlatformId | null>(null);
  const [connectionError, setConnectionError] = useState<Record<string, string>>({});

  const connectedCount = Object.keys(connections).length;
  useEffect(() => { setConnectionsCount(connectedCount); }, [connectedCount, setConnectionsCount]);

  async function saveConnection(platform: PlatformId) {
    const url = (connectionDraft[platform] ?? "").trim();
    setSavingConnection(platform);
    setConnectionError((prev) => ({ ...prev, [platform]: "" }));
    const res = await fetch("/api/platform-connections", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, profile_url: url }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setConnectionError((prev) => ({ ...prev, [platform]: body?.error?.message ?? t("errorSave") }));
      setSavingConnection(null); return;
    }
    setConnections((prev) => ({ ...prev, [platform]: url }));
    setSavingConnection(null);
  }

  async function removeConnection(platform: PlatformId) {
    setDeletingConnection(platform);
    const res = await fetch("/api/platform-connections", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setConnectionError((prev) => ({ ...prev, [platform]: body?.error?.message ?? t("errorDelete") }));
      setDeletingConnection(null); return;
    }
    setConnections((prev) => { const n = { ...prev }; delete n[platform]; return n; });
    setConnectionDraft((prev) => { const n = { ...prev }; delete n[platform]; return n; });
    setDeletingConnection(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-1">
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="text-xs text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_IDS.map((id) => {
          const style = PLATFORM_STYLES[id];
          const saved = connections[id];
          const draft = connectionDraft[id] ?? "";
          const isDirty = draft !== (saved ?? "");
          const err = connectionError[id];

          return (
            <Card key={id} className={`shadow-sm overflow-hidden ${ELEVATED} hover:-translate-y-0.5 ${style.accent}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.icon}`}>
                    <PlatformLogo platform={id} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{PLATFORMS[id].label}</p>
                    {saved ? (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                        {t("connected")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">{t("notConnected")}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={draft}
                    onChange={(e) => setConnectionDraft((prev) => ({ ...prev, [id]: e.target.value }))}
                    placeholder={PLATFORM_URL_PLACEHOLDERS[id]}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  {err && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />{err}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={saved && !isDirty ? "outline" : "default"}
                    disabled={savingConnection === id || !draft.trim()}
                    onClick={() => saveConnection(id)}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    {savingConnection === id ? t("saving") : saved && !isDirty ? t("saved") : t("save")}
                  </Button>
                  {saved && (
                    <>
                      <a
                        href={saved}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />{t("view")}
                      </a>
                      <button
                        onClick={() => removeConnection(id)}
                        disabled={deletingConnection === id}
                        className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                        title={t("removeConnection")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
