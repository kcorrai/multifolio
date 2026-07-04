import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalShell } from "@/components/legal-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// KVKK Aydınlatma Metni (herkese açık; TR'de zorunlu). İçerik: legalKvkk.
const SECTIONS = ["controller", "data", "purpose", "basis", "transfer", "method", "rights", "contact"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legalKvkk");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function KvkkPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("legalKvkk");

  return (
    <LegalShell
      isLoggedIn={!!user}
      eyebrow={t("eyebrow")}
      title={t("title")}
      updated={t("updated")}
      intro={t("intro")}
      draftNotice={t("draftNotice")}
      sections={SECTIONS.map((k) => ({ title: t(`${k}Title`), body: t(`${k}Body`) }))}
    />
  );
}
