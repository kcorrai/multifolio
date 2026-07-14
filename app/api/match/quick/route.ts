// POST /api/match/quick → ham iş ilanı metnine karşı ÜCRETSİZ, deterministik profil
// eşleşme skoru (AI/kredi YOK). Tarayıcı uzantısı iş ilanı sayfasında canlı skor rozeti
// için çağırır (Teal/Jobalytics tarzı — göndermeden önce uyum sinyali). Auth-gated.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { quickJobMatch } from "@/lib/feed/relevance";

const bodySchema = z.object({
  title: z.string().trim().max(500).optional(),
  text: z.string().trim().min(1).max(20_000),
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, bodySchema);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("headline, skills")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  // Profil/skill yoksa sinyal yetersiz → skor null (uzantı rozet göstermez).
  if (!profile || !Array.isArray(profile.skills) || profile.skills.length === 0) {
    return NextResponse.json({ score: null });
  }

  const result = quickJobMatch(
    { headline: profile.headline as string | null, skills: profile.skills as string[] },
    input.title ?? "",
    input.text,
  );
  return NextResponse.json(result);
});
