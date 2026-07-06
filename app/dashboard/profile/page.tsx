import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileTab } from "@/components/dashboard/profile-tab";
import type { InitialProfile, ConnectedProfile } from "@/components/dashboard/shared";
import { PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Çekirdek profil + platformlardan çekilmiş public profiller tek turda.
  const [profileRes, platformRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills, avatar_url, portfolio, projects")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("platform_profiles")
      .select("platform, headline, summary, skills, avatar_url, portfolio, source_url, fetched_at")
      .eq("user_id", user.id)
      .order("fetched_at", { ascending: false }),
  ]);

  const data = profileRes.data;
  const initialProfile: InitialProfile | null = data
    ? {
        headline: data.headline as string,
        summary: data.summary as string,
        skills: (data.skills as string[]) ?? [],
        avatarUrl: (data.avatar_url as string | null) ?? null,
        portfolio: (data.portfolio as PortfolioItem[]) ?? [],
        projects: (data.projects as ProfileProject[]) ?? [],
      }
    : null;

  // Geçerli platform id'lerine filtrele (şema dışı satır UI'ı bozmasın).
  const connectedProfiles: ConnectedProfile[] = (platformRes.data ?? [])
    .filter((r) => PLATFORM_IDS.includes(r.platform as PlatformId))
    .map((r) => ({
      platform: r.platform as PlatformId,
      headline: (r.headline as string) ?? "",
      summary: (r.summary as string) ?? "",
      skills: (r.skills as string[]) ?? [],
      avatarUrl: (r.avatar_url as string | null) ?? null,
      sourceUrl: (r.source_url as string | null) ?? null,
      fetchedAt: r.fetched_at as string,
      portfolio: (r.portfolio as PortfolioItem[]) ?? [],
    }));

  return <ProfileTab initialProfile={initialProfile} connectedProfiles={connectedProfiles} />;
}
