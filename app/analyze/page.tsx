// Herkese açık ücretsiz profil analiz sayfası (edinim kancası): kayıtsız
// kullanıcı profil URL'i/metni verir → skor + ilk öneri; tam rapor kayıt ister
// (teaser SUNUCUDA kesilir — /api/analyze `full:null` döner).
// Kabuk: Solar Pop ToolShell.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { AnalyzeForm } from "@/components/analyze/analyze-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("publicAnalysis");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/analyze" } };
}

export default async function AnalyzePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <ToolShell tool="analyze" href="/analyze" isLoggedIn={isLoggedIn}>
      <ToolSection>
        <AnalyzeForm isLoggedIn={isLoggedIn} />
      </ToolSection>
    </ToolShell>
  );
}
