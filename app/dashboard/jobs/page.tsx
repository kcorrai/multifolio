import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobsTab } from "@/components/dashboard/jobs-tab";
import type { JobRow } from "@/components/dashboard/shared";

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, jobsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];

  return <JobsTab initialJobs={jobs} profileSaved={profileRes.data !== null} />;
}
