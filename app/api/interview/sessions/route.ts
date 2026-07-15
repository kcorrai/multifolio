// GET /api/interview/sessions → kullanıcının geçmiş sahte-mülakat oturumları (ilerleme takibi).
// Tam questions jsonb'siyle döner → istemci raporu ekstra istek olmadan yeniden açabilir.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { interviewSessionSchema } from "@/lib/validation/schemas/mock-interview";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, job_id, difficulty, categories, question_count, overall_score, status, questions, created_at, completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  // Şemaya göre süz (bozuk/eski satır varsa atla — sağlamlık).
  const sessions = (data ?? [])
    .map((row) => interviewSessionSchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data);

  return NextResponse.json({ sessions });
});
