import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortfolioTab } from "@/components/dashboard/portfolio-tab";
import type { InitialPortfolio } from "@/components/dashboard/shared";

export default async function PortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
  ]);

  const initialPortfolio: InitialPortfolio | null = portfolioRes.data
    ? { slug: portfolioRes.data.slug as string, published: portfolioRes.data.published as boolean, content: portfolioRes.data.content ?? null }
    : null;

  return <PortfolioTab profileSaved={profileRes.data !== null} initialPortfolio={initialPortfolio} />;
}
