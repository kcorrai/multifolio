// Bildirim üretici yardımcı: service-role client ile `notifications` satırı ekler.
// Fire-and-forget deseni (e-posta bildirimi gibi) — bildirim eklenemese bile
// ana akış kesilmez; hata izole edilir (Sentry'e log). Client parametre alınır
// (admin.ts'yi import ETMEZ → server-only bağımlılığı çağırana bırakır).
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewNotification {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}

export async function createNotification(
  admin: SupabaseClient,
  n: NewNotification,
): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
  });
  if (error) console.error("createNotification failed:", error.message);
}
