// /admin — yalnız ADMIN_EMAILS allowlist'indeki kullanıcıya açık (aksi → notFound()).
// Tüm ürün geri bildirimlerini (service-role) gönderen e-postasıyla listeler; kategori
// filtresi (?cat=) saf link'lerle (client JS yok). RLS bypass edilir ama önce admin doğrulanır.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft, Bug, Lightbulb, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { FEEDBACK_CATEGORIES, type FeedbackCategory, type FeedbackRow } from "@/lib/validation/schemas/feedback";

const CATEGORY_ICON: Record<FeedbackCategory, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Admin değilse sayfa hiç yokmuş gibi davran (varlığını sızdırma).
  if (!isAdminEmail(user.email)) notFound();

  const t = await getTranslations("admin");
  const tf = await getTranslations("feedback");
  const locale = await getLocale();
  const { cat } = await searchParams;
  const activeCat = (FEEDBACK_CATEGORIES as readonly string[]).includes(cat ?? "") ? (cat as FeedbackCategory) : null;

  // RLS bypass — TÜM geri bildirimler (admin doğrulandıktan SONRA).
  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin
    .from("feedback")
    .select("id, user_id, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const all = (rows ?? []) as (FeedbackRow & { user_id: string })[];

  // Kategori sayıları (filtreden bağımsız — tüm veri üzerinden).
  const counts = all.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  // Gönderen e-postalarını çöz (benzersiz user_id başına tek çağrı).
  const uniqueIds = [...new Set(all.map((r) => r.user_id))];
  const emailEntries = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      return [id, data.user?.email ?? id] as const;
    }),
  );
  const emailById = new Map(emailEntries);

  const list = activeCat ? all.filter((r) => r.category === activeCat) : all;

  const filterHref = (c: FeedbackCategory | null) => (c ? `/admin?cat=${c}` : "/admin");
  const chip = (label: string, count: number, href: string, active: boolean) => (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "border-[#00F0FF]/60 bg-[#00F0FF]/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span className="rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[11px] leading-none tabular-nums">{count}</span>
    </Link>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Üst bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-base font-semibold">{t("title")}</h1>
        </div>
        <span className="text-xs text-muted-foreground">{t("adminBadge")}</span>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">{t("feedbackDesc")}</p>

        {/* Kategori filtresi */}
        <div className="mt-5 flex flex-wrap gap-2">
          {chip(t("all"), all.length, filterHref(null), activeCat === null)}
          {FEEDBACK_CATEGORIES.map((c) => chip(tf(`category.${c}`), counts[c] ?? 0, filterHref(c), activeCat === c))}
        </div>

        {/* Liste */}
        <div className="mt-6 space-y-3">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            list.map((f) => {
              const Icon = CATEGORY_ICON[f.category];
              return (
                <div key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-[#00F0FF]" />
                      <span className="text-xs font-semibold">{tf(`category.${f.category}`)}</span>
                      <span className="truncate text-xs text-muted-foreground">· {emailById.get(f.user_id)}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/70">
                      {new Date(f.created_at).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{f.message}</p>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
