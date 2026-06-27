// Sunucu tarafı Supabase client'ı (cookie-tabanlı oturum, ANON anahtar).
// RLS AKTİF kalır: bu client kullanıcının kendi oturumu adına çalışır, dolayısıyla
// veritabanı politikaları (auth.uid() = user_id) uygulanır. Veri erişimi yalnızca
// parametreli Supabase sorguları üzerinden yapılır (ham SQL string birleştirme yok).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrıldığında set başarısız olabilir; bu durumda
            // oturum yenileme middleware/route handler'da gerçekleşir.
          }
        },
      },
    },
  );
}
