// GET /api/fx → güncel USD→TRY kuru (public; net kazanç hesaplayıcısı prefill için).
// Ücretsiz + anahtar gerektirmeyen open.er-api.com. Sunucuda 6 saat cache'lenir
// (kur saatlik oynamaz; kota/CORS derdi olmaz). Dış API düşerse rate:null döner →
// istemci elle giriş yedeğine düşer (akış kilitlenmez).
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";

const SIX_HOURS = 6 * 60 * 60;

export const GET = withErrorHandler(async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: SIX_HOURS },
    });
    if (!res.ok) return NextResponse.json({ rate: null });
    const data = (await res.json()) as { rates?: { TRY?: unknown } };
    const rate = data?.rates?.TRY;
    return NextResponse.json({ rate: typeof rate === "number" && rate > 0 ? rate : null });
  } catch {
    // Dış servis hatası akışı bozmasın — elle giriş hâlâ çalışır.
    return NextResponse.json({ rate: null });
  }
});
