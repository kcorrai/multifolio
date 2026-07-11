// GET  /api/portfolio → oturum sahibinin portfolyosunu döner (yoksa null).
// PUT  /api/portfolio → slug / published / content alanlarını günceller (kısmi).
// Şablon: app/api/profile/route.ts ile aynı koruma deseni.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { portfolioUpdateSchema } from "@/lib/validation/schemas/portfolio";
import { buildProjectGroups } from "@/lib/portfolio/media";
import type { ProfileProject } from "@/lib/validation/schemas/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("portfolios")
    .select("id, slug, published, content, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return NextResponse.json({ portfolio: data });
});

export const PUT = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, portfolioUpdateSchema);

  // İçerik güncelleniyorsa: "proje-proje" gösterim gruplarını canlı profilden YENİDEN
  // KUR (ücretsiz senkron — AI/kredi yok). projectGroups kullanıcı-küratörlü değil,
  // tamamen yapılandırılmış profil verisinden türetilir; bu sayede kullanıcı projelerini
  // import ettikten sonra portfolyoyu yeniden ÜRETMEK (3 kredi) zorunda kalmadan
  // "By project" modu import edilen projeleri gösterir. Galeri kullanıcı-küratörlü
  // (silinebilir) olduğundan DOKUNULMAZ.
  if (input.content) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("projects")
      .eq("user_id", user.id)
      .maybeSingle();
    input.content.media.projectGroups = buildProjectGroups(
      (profileData?.projects as ProfileProject[] | null) ?? null,
    );
  }

  // Satır zaten var mı? Varsa KISMİ update (slug göndermek zorunlu değil);
  // yoksa insert (slug NOT NULL → şart). Not: upsert burada kullanılamaz —
  // Postgres ON CONFLICT'te slug'sız insert'i NOT NULL ihlaliyle reddeder.
  const { data: existing, error: exErr } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (exErr) throw exErr;

  const cols = "id, slug, published, content, updated_at";
  const { data, error } = existing
    ? await supabase.from("portfolios").update(input).eq("user_id", user.id).select(cols).single()
    : await (async () => {
        if (!input.slug) throw new ValidationError((await getTranslations("errors"))("portfolioNotGenerated"));
        return supabase.from("portfolios").insert({ user_id: user.id, ...input }).select(cols).single();
      })();

  if (error) throw error;

  return NextResponse.json({ portfolio: data });
});
