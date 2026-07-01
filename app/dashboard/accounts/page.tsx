import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountsTab } from "@/components/dashboard/accounts-tab";

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("platform_connections")
    .select("platform, profile_url, updated_at")
    .eq("user_id", user.id);

  const initialConnections = Object.fromEntries(
    (data ?? []).map((c) => [c.platform, c.profile_url as string])
  ) as Record<string, string>;

  return <AccountsTab initialConnections={initialConnections} />;
}
