// Ana sayfa (sunucu bileşeni). Oturum açıksa Profil Stüdyosu'nu (profil + uyarlama
// + harcama) gösterir; değilse giriş çağrısı. Veri erişimi RLS'li server client ile.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileStudio } from "@/components/profile-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Multifolio</h1>
          <p className="mt-2 text-neutral-500">
            Çoklu platform freelancer kariyer aracı. Profilini bir kez gir; her platform için
            optimize et.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Başlamak için giriş yap</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Giriş</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Kayıtlı profil ve kümülatif harcamayı paralel çek (RLS sahibe sınırlar).
  const [profileRes, usageRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("usage_events").select("cost_usd").eq("user_id", user.id),
  ]);

  const initialProfile = profileRes.data
    ? {
        headline: profileRes.data.headline as string,
        summary: profileRes.data.summary as string,
        skills: (profileRes.data.skills as string[]) ?? [],
      }
    : null;

  const initialSpendUsd = (usageRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.cost_usd ?? 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <div className="mb-6 flex justify-end">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            Çıkış
          </Button>
        </form>
      </div>
      <ProfileStudio initialProfile={initialProfile} initialSpendUsd={initialSpendUsd} />
    </main>
  );
}
