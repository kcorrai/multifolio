import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { MockInterview } from "@/components/dashboard/mock-interview";

export default async function InterviewPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  // Profil varlığı (soru üretimi profil ister) + iş seçici için kullanıcının ilanları.
  const [profileRes, jobsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("job_listings")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const jobs = ((jobsRes.data ?? []) as { id: string; title: string }[]).map((j) => ({ id: j.id, title: j.title }));

  return <MockInterview profileSaved={profileRes.data !== null} jobs={jobs} />;
}
