import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { FeedbackTab } from "@/components/dashboard/feedback-tab";
import type { FeedbackRow } from "@/lib/validation/schemas/feedback";

export default async function FeedbackPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  // Kullanıcının kendi geri bildirim geçmişi (RLS select-own).
  const { data } = await supabase
    .from("feedback")
    .select("id, category, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return <FeedbackTab initialFeedback={(data as FeedbackRow[] | null) ?? []} />;
}
