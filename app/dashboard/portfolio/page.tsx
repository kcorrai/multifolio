import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { PortfolioTab } from "@/components/dashboard/portfolio-tab";
import type { InitialPortfolio } from "@/components/dashboard/shared";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";
import { buildProjectGroups } from "@/lib/portfolio/media";
import type { ProfileProject } from "@/lib/validation/schemas/profile";

export default async function PortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  // profiles.projects'i de çek: "proje-proje" gruplarını canlı profilden kur (ücretsiz)
  // → editör kaydetmeden ÖNCE bile import edilen projeleri "By project" modunda gösterir
  // (PUT save de aynı şekilde persist eder; yeniden ÜRETİM/3 kredi gerekmez).
  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from("profiles").select("user_id, projects").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
  ]);

  // İçeriği şemayla normalize et → eski (theme/media'sız) kayıtlar default alır.
  const parsed = portfolioRes.data?.content
    ? portfolioContentSchema.safeParse(portfolioRes.data.content)
    : null;

  // Canlı profilden taze proje grupları. Kayıtlı içerikten farklıysa (kullanıcı projeleri
  // sonradan import etmiş VEYA eski şema role/skill taşımıyor) editöre enjekte edip
  // "kaydedilmemiş" işaretle → kullanıcı Kaydet'e basınca public sayfaya yansır (PUT de
  // aynı şekilde kurar; yeniden ÜRETİM/3 kredi gerekmez).
  const freshGroups = buildProjectGroups((profileRes.data?.projects as ProfileProject[] | null) ?? null);
  let content = parsed?.success ? parsed.data : null;
  let projectsNeedSync = false;
  if (content) {
    const savedGroups = content.media.projectGroups ?? [];
    if (JSON.stringify(savedGroups) !== JSON.stringify(freshGroups)) {
      content = { ...content, media: { ...content.media, projectGroups: freshGroups } };
      projectsNeedSync = true;
    }
  }

  const initialPortfolio: InitialPortfolio | null = portfolioRes.data
    ? {
        slug: portfolioRes.data.slug as string,
        published: portfolioRes.data.published as boolean,
        content,
      }
    : null;

  return (
    <PortfolioTab
      profileSaved={profileRes.data !== null}
      initialPortfolio={initialPortfolio}
      projectsNeedSync={projectsNeedSync}
    />
  );
}
