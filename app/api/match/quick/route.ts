// POST /api/match/quick → ham iş ilanı metnine karşı ÜCRETSİZ, deterministik profil
// eşleşme skoru (AI/kredi YOK). Tarayıcı uzantısı iş ilanı sayfasında canlı skor rozeti
// için çağırır (Teal/Jobalytics tarzı — göndermeden önce uyum sinyali). Auth-gated.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { quickJobMatch } from "@/lib/feed/relevance";

const bodySchema = z.object({
  title: z.string().trim().max(500).optional(),
  text: z.string().trim().min(1).max(20_000),
});

// Uzantı iş sayfası başına çağırır → cömert saatlik tavan (kaçak/rogue-istemci koruması,
// diğer ücretsiz uç noktalarla aynı desen). Aşımda GRACEFUL: skor null (rozet gösterilmez),
// hata fırlatılmaz (pasif rozet için sessiz degrade daha iyi UX).
const HOURLY_LIMIT = 120;

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, bodySchema);

  // Saatlik hız sınırı (RLS select_own; kaçak döngü koruması).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "match_quick")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) return NextResponse.json({ score: null });

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

  // Gözlemlenebilirlik + hız sınırı sayacı (ÜCRETSİZ — credits_spent 0; service-role yazar).
  const admin = createSupabaseAdminClient();
  await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "match_quick",
    model: "deterministic",
    input_tokens: 0,
    output_tokens: 0,
    cost_usd: 0,
    credits_spent: 0,
  });

  return NextResponse.json(result);
});
