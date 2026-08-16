// Herkese açık teklif ROI hesaplayıcı (SEO aracı): teklif harcaması (Connect/kredi)
// vs kazanılan iş getirisi. Tamamen istemcide — AI/API/kredi yok.
// Kabuk: Solar Pop ToolShell.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { RoiCalculator } from "@/components/roi/roi-calculator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("roi");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/roi" } };
}

export default async function RoiPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ToolShell tool="roi" href="/roi" isLoggedIn={!!user}>
      <ToolSection>
        <RoiCalculator />
      </ToolSection>
    </ToolShell>
  );
}
