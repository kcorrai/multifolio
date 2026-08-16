// Herkese açık teklif denetçisi (SEO aracı): teklif taslağını yapıştır → yapısal
// skor + bulgular. Tamamen istemcide — AI/API/kredi yok.
// Kabuk: Solar Pop ToolShell.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolShell, ToolSection } from "@/components/solar/tool-shell";
import { ProposalChecker } from "@/components/proposal-check/proposal-checker";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("proposalChecker");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/proposal-checker" } };
}

export default async function ProposalCheckerPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ToolShell tool="proposal" href="/proposal-checker" isLoggedIn={!!user}>
      <ToolSection>
        <ProposalChecker />
      </ToolSection>
    </ToolShell>
  );
}
