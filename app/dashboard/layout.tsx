import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maybeGrantSignupCredits } from "@/lib/credits/signup-bonus";
import { isAdminEmail } from "@/lib/admin";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reklamı yapılan kayıt kredisini ilk ziyarette ver (idempotent; bakiye çekilmeden ÖNCE).
  await maybeGrantSignupCredits(user);

  const [creditsRes, usageRes, jobsCountRes, connCountRes] = await Promise.all([
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("usage_events").select("credits_spent").eq("user_id", user.id),
    supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("platform_connections").select("platform", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const credits = creditsRes.data?.balance ?? 0;
  const creditsUsed = (usageRes.data ?? []).reduce((sum, r) => sum + Number(r.credits_spent ?? 0), 0);
  const emailVerified = user.app_metadata?.email_verified === true;
  const isAdmin = isAdminEmail(user.email);

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      credits={credits}
      initialCreditsUsed={creditsUsed}
      initialJobsCount={jobsCountRes.count ?? 0}
      initialConnectionsCount={connCountRes.count ?? 0}
      emailVerified={emailVerified}
      isAdmin={isAdmin}
    >
      {children}
    </DashboardShell>
  );
}
