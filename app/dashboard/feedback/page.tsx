import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FeedbackTab } from "@/components/dashboard/feedback-tab";
import type { FeedbackRow } from "@/lib/validation/schemas/feedback";

export default async function FeedbackPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
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
