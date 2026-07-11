"use client";

// Dashboard topbar bildirim zili + inbox. GET /api/notifications ile son
// bildirimleri ve okunmamış sayısını çeker (60 sn poll). Zil rozeti okunmamış
// sayısını gösterir; açılır panel listeler; bildirime tıklayınca okundu işaretlenir
// ve (varsa) link'e gider. Migration 0031 uygulanmadıysa fetch başarısız olur →
// zil sessizce boş/rozetsiz kalır (arayüz bozulmaz).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";
import type { NotificationRow } from "@/lib/validation/schemas/notification";

function useRelativeTime(locale: string) {
  return useCallback((iso: string) => {
    const then = new Date(iso).getTime();
    const diff = then - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const min = 60_000, hr = 3_600_000, day = 86_400_000;
    if (abs < hr) return rtf.format(Math.round(diff / min), "minute");
    if (abs < day) return rtf.format(Math.round(diff / hr), "hour");
    return rtf.format(Math.round(diff / day), "day");
  }, [locale]);
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const rel = useRelativeTime(locale);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // İlk yükleme + 60 sn poll. setState `.then` callback'inde (effect gövdesinde
  // doğrudan DEĞİL → set-state-in-effect lint'i tetiklenmez). Migration yoksa/
  // hatada sessizce degrade (zil boş/rozetsiz kalır).
  useEffect(() => {
    let active = true;
    const tick = () =>
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active || !d) return;
          setItems(d.notifications ?? []);
          setUnread(d.unreadCount ?? 0);
        })
        .catch(() => {});
    tick();
    const iv = setInterval(tick, 60_000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  // Dışına tıklayınca kapat.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function markRead(id?: string) {
    // Optimistic
    setItems((prev) => prev.map((n) => (!id || n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => (id ? Math.max(0, u - (items.find((n) => n.id === id && !n.read) ? 1 : 0)) : 0));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    }).catch(() => {});
  }

  function openItem(n: NotificationRow) {
    if (!n.read) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("bellLabel")}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00F0FF] px-1 text-[9px] font-bold text-[#090A0F] tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{t("title")}</p>
            {unread > 0 && (
              <button
                onClick={() => markRead()}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-3 w-3" />{t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">{t("empty")}</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/60 last:border-0 transition-colors hover:bg-muted/50 ${
                    n.read ? "" : "bg-[#00F0FF]/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#00F0FF] shrink-0" />}
                    <div className={`flex-1 min-w-0 ${n.read ? "pl-3.5" : ""}`}>
                      <p className="text-xs font-semibold leading-snug">{n.title}</p>
                      {n.body && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{rel(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
