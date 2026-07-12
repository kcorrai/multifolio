// POST /api/job-reads → verilen pool ilanlarını "okundu" işaretle (tek veya toplu).
// job_reads'e upsert; aynı satır varsa dokunmaz (idempotent). Yıldız akışının eşi.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { jobReadSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { jobPoolIds } = await parseJson(req, jobReadSchema);
  const rows = jobPoolIds.map((id) => ({ user_id: user.id, job_pool_id: id }));
  const { error } = await supabase
    .from("job_reads")
    .upsert(rows, { onConflict: "user_id,job_pool_id", ignoreDuplicates: true });
  if (error) throw error;
  return NextResponse.json({ ok: true }, { status: 201 });
});
