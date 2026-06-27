// Kullanıcının kümülatif harcamasını döner. RLS sayesinde yalnızca kendi
// usage_events kayıtlarını okur (sahibe sınırlı).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("usage_events")
    .select("cost_usd")
    .eq("user_id", user.id);
  if (error) throw error;

  const totalUsd = (data ?? []).reduce(
    (sum, row) => sum + Number(row.cost_usd ?? 0),
    0,
  );

  return NextResponse.json({ totalUsd, count: data?.length ?? 0 });
});
