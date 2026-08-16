// Herkese açık ATS/CV denetleyici (SEO aracı): CV metnini yapıştır → yapısal
// skor + bulgular. Tamamen istemcide — metin sunucuya GİTMEZ, AI/kredi yok.
// Kabuk: Solar Pop ToolShell.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { AtsCheckForm } from "@/components/ats/ats-check-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("atsCheck");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/ats-check" } };
}

export default async function AtsCheckPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ToolShell tool="ats" href="/ats-check" isLoggedIn={!!user}>
      <ToolSection>
        <AtsCheckForm />
      </ToolSection>
    </ToolShell>
  );
}
