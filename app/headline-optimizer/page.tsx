// Herkese açık başlık optimize edici (SEO aracı): profil başlığını yapıştır →
// 4 eksende puan + platform bazlı yeniden yazım örnekleri. Tamamen istemcide.
// Kabuk: Solar Pop ToolShell.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { HeadlineOptimizer } from "@/components/headline/headline-optimizer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("headlineOptimizer");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/headline-optimizer" },
  };
}

export default async function HeadlineOptimizerPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ToolShell tool="headline" href="/headline-optimizer" isLoggedIn={!!user}>
      <ToolSection>
        <HeadlineOptimizer />
      </ToolSection>
    </ToolShell>
  );
}
