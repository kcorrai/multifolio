import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { platformIdSchema } from "@/lib/ai/platforms";
import { PlatformDetailTab } from "@/components/dashboard/platform-detail-tab";
import type { JobRow, InitialProfile } from "@/components/dashboard/shared";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";
import type { PlatformProfileRow } from "@/lib/validation/schemas/platform-profile";
import type { ProposalRow } from "@/lib/validation/schemas/proposal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformDetailPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = platformIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const platform = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, connRes, jobsRes, proposalsRes, adaptRes, platformProfileRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills, avatar_url, portfolio, projects").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("profile_url").eq("user_id", user.id).eq("platform", platform).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).eq("platform", platform).order("created_at", { ascending: false }),
    supabase.from("proposals").select("id, job_id, platform, content, coverage, created_at").eq("user_id", user.id).eq("platform", platform).order("created_at", { ascending: false }),
    supabase.from("adaptations").select("headline, body").eq("user_id", user.id).eq("platform", platform).maybeSingle(),
    supabase.from("platform_profiles").select("platform, headline, summary, skills, avatar_url, portfolio, source_url, fetched_at").eq("user_id", user.id).eq("platform", platform).maybeSingle(),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const proposals = (proposalsRes.data ?? []) as unknown as ProposalRow[];

  const profile: InitialProfile | null = profileRes.data
    ? {
        headline: profileRes.data.headline as string,
        summary: profileRes.data.summary as string,
        skills: (profileRes.data.skills as string[]) ?? [],
        avatarUrl: (profileRes.data.avatar_url as string | null) ?? null,
        portfolio: (profileRes.data.portfolio as PortfolioItem[]) ?? [],
        // Yalnız BU platformdan içe aktarılan yapılandırılmış projeler (platform-filtreli).
        projects: ((profileRes.data.projects as ProfileProject[]) ?? []).filter((p) => p.platform === platform),
      }
    : null;

  return (
    <PlatformDetailTab
      platform={platform}
      profile={profile}
      initialPlatformProfile={(platformProfileRes.data as unknown as PlatformProfileRow | null) ?? null}
      connectionUrl={(connRes.data?.profile_url as string) ?? null}
      jobs={jobs}
      proposals={proposals}
      initialAdaptResult={(adaptRes.data as { headline: string; body: string } | null) ?? null}
    />
  );
}
