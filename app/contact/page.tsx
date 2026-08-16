import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// İletişim sayfası (herkese açık). E-posta i18n'de (legalContact.email) —
// kullanıcı değiştirebilir. mailto ile doğrudan iletişim.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legalContact");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("legalContact");
  const email = t("email");

  return (
    <div className="sp-page">
      <SiteHeader isLoggedIn={!!user} />

      <section className="mx-auto max-w-3xl px-8 pt-20 pb-24 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FA531C]">{t("eyebrow")}</p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">{t("title")}</h1>
          <p className="text-lg text-slate-600 dark:text-[#6B4A3C] leading-relaxed font-medium">{t("intro")}</p>
        </div>

        <a
          href={`mailto:${email}`}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-5 py-4 hover:border-[#FA531C]/40 transition-colors"
        >
          <span className="h-11 w-11 shrink-0 rounded-xl bg-[#FA531C]/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-[#FA531C]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">{t("emailLabel")}</p>
            <p className="text-base font-semibold truncate">{email}</p>
          </div>
        </a>

        <p className="text-sm text-slate-500 dark:text-[#6B4A3C] leading-relaxed">{t("note")}</p>
      </section>

      <SiteFooter />
    </div>
  );
}
