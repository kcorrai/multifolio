// Canlılık (liveness) kontrolü. Bağımlılık çağırmaz; sadece süreç ayakta mı?
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";

export const GET = withErrorHandler(async () => {
  return NextResponse.json({ ok: true, service: "multifolio", ts: Date.now() });
});
