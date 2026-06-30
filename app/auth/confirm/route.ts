// Magic-link dönüş noktası: PKCE (code) ve OTP (token_hash) akışlarını destekler.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async (req) => {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth/confirm] exchangeCodeForSession error:", JSON.stringify(error));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth/confirm] verifyOtp error:", JSON.stringify(error));
  } else {
    console.error("[auth/confirm] no code or token_hash — params:", Object.fromEntries(searchParams));
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
});
