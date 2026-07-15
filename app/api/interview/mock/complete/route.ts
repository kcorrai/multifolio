// POST /api/interview/mock/complete → oturumu 'completed' yapar + genel skoru (yanıtlanan
// skorların ortalaması) ve gelişim temalarını hesaplar. AI/kredi YOK — deterministik rapor.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { mockCompleteSchema, type InterviewQuestionRecord } from "@/lib/validation/schemas/mock-interview";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSessionReport } from "@/lib/interview/report";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, mockCompleteSchema);

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .select("questions")
    .eq("id", input.session_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!session) throw new NotFoundError();

  const questions = (session.questions as InterviewQuestionRecord[]) ?? [];
  const report = buildSessionReport(questions);

  const { error: updateError } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      overall_score: report.overallScore,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.session_id)
    .eq("user_id", user.id);
  if (updateError) throw updateError;

  return NextResponse.json({ report });
});
