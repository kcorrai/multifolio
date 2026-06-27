// Next.js 16 "proxy" konvansiyonu (eski adı middleware). Her istekte Supabase
// oturumunu yeniler. Asıl mantık lib/supabase/middleware.ts içindedir.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Statik varlıkları ve Sentry tünel rotasını dışla.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
