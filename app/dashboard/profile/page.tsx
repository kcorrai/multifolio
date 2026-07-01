import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileTab } from "@/components/dashboard/profile-tab";
import type { InitialProfile } from "@/components/dashboard/shared";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialProfile: InitialProfile | null = data
    ? { headline: data.headline as string, summary: data.summary as string, skills: (data.skills as string[]) ?? [] }
    : null;

  return <ProfileTab initialProfile={initialProfile} />;
}
