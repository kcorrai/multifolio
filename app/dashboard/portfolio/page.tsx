import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortfolioTab } from "@/components/dashboard/portfolio-tab";
import type { InitialPortfolio } from "@/components/dashboard/shared";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";

export default async function PortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
  ]);

  // İçeriği şemayla normalize et → eski (theme/media'sız) kayıtlar default alır.
  const parsed = portfolioRes.data?.content
    ? portfolioContentSchema.safeParse(portfolioRes.data.content)
    : null;

  const initialPortfolio: InitialPortfolio | null = portfolioRes.data
    ? {
        slug: portfolioRes.data.slug as string,
        published: portfolioRes.data.published as boolean,
        content: parsed?.success ? parsed.data : null,
      }
    : null;

  return <PortfolioTab profileSaved={profileRes.data !== null} initialPortfolio={initialPortfolio} />;
}
