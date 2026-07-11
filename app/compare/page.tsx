// Herkese açık çok-platform net gelir karşılaştırıcı (SEO aracı / edinim kancası —
// /earnings deseni): tek proje tutarı → 5 platformda ele geçen net yan yana.
// "Tek profil, çok platform" tezini somutlaştırır. İstemcide hesaplanır; auth/AI/kredi yok.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlatformCompare } from "@/components/compare/platform-compare";
import { ArmutRoi } from "@/components/compare/armut-roi";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("compare");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/compare" } };
}

export default async function ComparePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const t = await getTranslations("compare");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <SiteHeader isLoggedIn={isLoggedIn} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
          <div className="absolute right-1/4 top-10 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-8 pt-20 pb-4 text-center space-y-4">
          <p className="anim-fade-up anim-d0 text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("heroEyebrow")}</p>
          <h1 className="anim-fade-up anim-d1 text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">{t("heroTitle")}</h1>
          <p className="anim-fade-up anim-d2 text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-xl mx-auto font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-8 py-12 space-y-8">
        <PlatformCompare isLoggedIn={isLoggedIn} />
        <ArmutRoi />
      </section>

      <SiteFooter />
    </div>
  );
}
