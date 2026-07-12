// İstek başına tek `auth.getUser()` ağ turu. getUser() yerel değildir — her çağrı
// Supabase Auth (GoTrue) sunucusuna bir tur atar. Dashboard'da layout + sekme sayfası
// aynı render pass içinde ayrı ayrı çağırınca aynı ağ turu tekrarlanıyordu. React
// cache() memoize'i sayesinde bu fonksiyon bir istekte kaç kez çağrılırsa çağrılsın
// altındaki getUser yalnızca bir kez gerçekleşir.
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getRequestUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
