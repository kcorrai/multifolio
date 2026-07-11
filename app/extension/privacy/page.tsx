import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EXTENSION_STORE_URL } from "@/lib/extension";

// Chrome Web Store yayını için zorunlu gizlilik politikası sayfası.
// İçerik i18n kataloglarında (extensionPrivacy) — EN varsayılan + TR.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("extensionPrivacy");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/extension/privacy" } };
}

const SECTIONS = ["collected", "use", "sharing", "permissions", "retention", "contact"] as const;

export default async function ExtensionPrivacyPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("extensionPrivacy");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <SiteHeader isLoggedIn={!!user} />

      <section className="mx-auto max-w-3xl px-8 pt-20 pb-24 space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("eyebrow")}</p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">{t("title")}</h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium">{t("updated")}</p>
          <p className="text-lg text-slate-600 dark:text-[#94A3B8] leading-relaxed font-medium">{t("intro")}</p>
          <a
            href={EXTENSION_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00F0FF] px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90"
          >
            {t("installCta")}
          </a>
        </div>

        {SECTIONS.map((key) => (
          <div key={key} className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">{t(`${key}Title`)}</h2>
            <p className="text-slate-600 dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">{t(`${key}Body`)}</p>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
