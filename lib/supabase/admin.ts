// ⚠️ SERVICE-ROLE client'ı — RLS'i BYPASS EDER. Yalnızca güvenilen sunucu
// kodunda, gerçekten admin yetkisi gereken işlemler için kullan. ASLA istemciye
// veya "use client" bir dosyaya import etme; SUPABASE_SERVICE_ROLE_KEY tarayıcıya
// sızdırılmamalı (bu yüzden NEXT_PUBLIC_ önekiyle DEĞİL). Varsayılan olarak
// kullanıcı isteklerinde server.ts (RLS'li) client'ı tercih et.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
