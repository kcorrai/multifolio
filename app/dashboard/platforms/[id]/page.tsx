import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { platformIdSchema } from "@/lib/ai/platforms";
import { PlatformDetailTab } from "@/components/dashboard/platform-detail-tab";
import type { JobRow } from "@/components/dashboard/shared";
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

  const [profileRes, connRes, jobsRes, proposalsRes, adaptRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("profile_url").eq("user_id", user.id).eq("platform", platform).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).eq("platform", platform).order("created_at", { ascending: false }),
    supabase.from("proposals").select("id, job_id, platform, content, coverage, created_at").eq("user_id", user.id).eq("platform", platform).order("created_at", { ascending: false }),
    supabase.from("adaptations").select("headline, body").eq("user_id", user.id).eq("platform", platform).maybeSingle(),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const proposals = (proposalsRes.data ?? []) as unknown as ProposalRow[];

  return (
    <PlatformDetailTab
      platform={platform}
      profileSaved={profileRes.data !== null}
      connectionUrl={(connRes.data?.profile_url as string) ?? null}
      jobs={jobs}
      proposals={proposals}
      initialAdaptResult={(adaptRes.data as { headline: string; body: string } | null) ?? null}
    />
  );
}
