import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileTab } from "@/components/dashboard/profile-tab";
import type { InitialProfile } from "@/components/dashboard/shared";
import type { PortfolioItem } from "@/lib/validation/schemas/profile";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("headline, summary, skills, avatar_url, portfolio")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialProfile: InitialProfile | null = data
    ? {
        headline: data.headline as string,
        summary: data.summary as string,
        skills: (data.skills as string[]) ?? [],
        avatarUrl: (data.avatar_url as string | null) ?? null,
        portfolio: (data.portfolio as PortfolioItem[]) ?? [],
      }
    : null;

  return <ProfileTab initialProfile={initialProfile} />;
}
