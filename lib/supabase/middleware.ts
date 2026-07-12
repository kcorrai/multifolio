// Supabase oturum yenileme middleware'i. Her istekte oturum cookie'lerini tazeler;
// aksi halde sunucu bileşenleri süresi dolmuş oturumla çalışır. RLS aktif kalır.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveMarket, MARKET_COOKIE, MARKET_GEO_HEADER } from "@/lib/markets/config";

const YEAR = 60 * 60 * 24 * 365;

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() JWT'yi YEREL doğrular (proje asimetrik ECC imzalama anahtarında —
  // Supabase JWT Keys). getUser gibi her istekte GoTrue'ya /auth/v1/user turu atmaz;
  // altındaki getSession süresi dolan token'ı yeniler (cookie tazeleme korunur).
  // Sonucu kullanmasak da çağrı oturumu tazeler. Simetrik anahtara düşülürse
  // getClaims otomatik getUser'a fallback yapar (davranış bozulmaz).
  await supabase.auth.getClaims();

  // İlk ziyarette pazar cookie'si yoksa Vercel geo header'ından VARSAYILAN pazarı
  // belirle ve yaz (kullanıcı bölge seçiciyle sonradan override edebilir).
  if (!request.cookies.get(MARKET_COOKIE)) {
    const marketId = resolveMarket(
      undefined,
      request.headers.get(MARKET_GEO_HEADER),
      request.headers.get("accept-language"),
    );
    response.cookies.set(MARKET_COOKIE, marketId, { path: "/", maxAge: YEAR });
  }

  return response;
}
