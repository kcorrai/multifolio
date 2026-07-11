import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalShell } from "@/components/legal-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Kullanım Şartları (herkese açık). İçerik i18n kataloglarında (legalTerms).
const SECTIONS = ["acceptance", "service", "account", "credits", "acceptable", "ip", "disclaimer", "changes", "contact"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legalTerms");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/terms" } };
}

export default async function TermsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("legalTerms");

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
