// Magic-link dönüş noktası: PKCE (code) ve OTP (token_hash) akışlarını destekler.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// AÇIK YÖNLENDİRME KORUMASI: `next` yalnızca aynı-origin (site-içi) göreli bir
// path olabilir. Mutlak URL ("https://evil.com"), protokol-göreli ("//evil.com")
// veya backslash hileleri ("/\evil.com") reddedilir → varsayılana düşer.
function safeNextPath(next: string | null): string {
  if (!next) return "/dashboard";
  // Tek "/" ile başlamalı; "//" ve "/\" protokol-göreli/host atlama denemeleridir.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }
  return next;
}

export const GET = withErrorHandler(async (req) => {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

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
