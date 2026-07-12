import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { CvTab } from "@/components/dashboard/cv-tab";
import type { InitialCv, CvJobOption } from "@/components/dashboard/shared";
import { cvContentSchema } from "@/lib/validation/schemas/cv";

export default async function CvPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  const [profileRes, cvRes, jobsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("cvs").select("content").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("job_listings")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // İçeriği şemayla normalize et → eski/eksik alanlar default alır.
  const parsed = cvRes.data?.content ? cvContentSchema.safeParse(cvRes.data.content) : null;
  const initialCv: InitialCv = { content: parsed?.success ? parsed.data : null };

  const jobs: CvJobOption[] = (jobsRes.data ?? []).map((j) => ({
    id: j.id as string,
    title: (j.title as string) ?? "",
  }));

  return <CvTab profileSaved={profileRes.data !== null} initialCv={initialCv} jobs={jobs} />;
}
