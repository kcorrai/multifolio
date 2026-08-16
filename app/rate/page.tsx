// Herkese açık ücret hesaplayıcı (SEO aracı / edinim kancası): istenen net
// gelirden geriye gereken saatlik/günlük ücret. Tamamen istemcide — AI/API/kredi
// yok. Kabuk: Solar Pop ToolShell (header + hero + çapraz-link + footer).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { RateCalculator } from "@/components/rate/rate-calculator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rate");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/rate" } };
}

export default async function RatePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ToolShell tool="rate" href="/rate" isLoggedIn={!!user}>
      <ToolSection>
        <RateCalculator />
      </ToolSection>
    </ToolShell>
  );
}
