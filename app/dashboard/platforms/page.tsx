import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { PlatformsHubTab } from "@/components/dashboard/platforms-hub-tab";
import type { PlatformId } from "@/lib/ai/platforms";

export default async function PlatformsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  const [profileRes, connRes, jobsRes, adaptRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("platform, profile_url").eq("user_id", user.id),
    supabase.from("job_listings").select("platform").eq("user_id", user.id),
    supabase.from("adaptations").select("platform").eq("user_id", user.id),
  ]);

  const connections = Object.fromEntries(
    (connRes.data ?? []).map((c) => [c.platform, c.profile_url as string])
  ) as Record<string, string>;

  // Platform başına ilan sayısı (null platform yok sayılır).
  const jobsByPlatform: Record<string, number> = {};
  for (const j of jobsRes.data ?? []) {
    if (j.platform) jobsByPlatform[j.platform] = (jobsByPlatform[j.platform] ?? 0) + 1;
  }

  return (
    <PlatformsHubTab
      profileSaved={profileRes.data !== null}
      connections={connections}
      jobsByPlatform={jobsByPlatform}
      initialAdaptedPlatforms={(adaptRes.data ?? []).map((a) => a.platform) as PlatformId[]}
    />
  );
}
