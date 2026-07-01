// E-posta doğrulama callback'i: OTP/PKCE'yi doğrular, app_metadata.email_verified=true yazar.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const GET = withErrorHandler(async (req) => {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error("[verify-email] exchange error:", JSON.stringify(error));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    if (error) console.error("[verify-email] verifyOtp error:", JSON.stringify(error));
  }

  if (!ok) return NextResponse.redirect(new URL("/dashboard?verify_error=1", origin));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/dashboard?verify_error=1", origin));

  const admin = createSupabaseAdminClient();
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { email_verified: true },
  });
  if (updErr) {
    console.error("[verify-email] updateUserById error:", JSON.stringify(updErr));
    return NextResponse.redirect(new URL("/dashboard?verify_error=1", origin));
  }

  return NextResponse.redirect(new URL("/dashboard?verified=1", origin));
});
