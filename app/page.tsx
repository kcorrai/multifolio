import Link from "next/link";
import { Layers, Globe, Briefcase, ArrowRight, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileStudio } from "@/components/profile-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        {/* Nav */}
        <header className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Multifolio</span>
          </div>
          <Button asChild variant="outline" size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
          <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20">
            Şu an beta — ilk kullanıcılar ücretsiz
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight max-w-3xl leading-tight">
            Freelancer kariyerini<br />
            <span className="text-indigo-400">tek platformdan</span> yönet.
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
            Profilini bir kez gir. LinkedIn, Upwork ve diğer platformlar için otomatik uyarla,
            portfolyo siteni anında yayınla, iş ilanlarını takip et.
          </p>
          <Button asChild size="lg" className="mt-10 h-12 px-8 text-base font-semibold">
            <Link href="/login">
              Hemen Başla <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {/* Feature bullets */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
            {[
              {
                icon: Layers,
                title: "Platform Uyarlama",
                desc: "Tek profil → LinkedIn, Upwork ve daha fazlası için Claude ile optimize metin.",
              },
              {
                icon: Globe,
                title: "Portfolyo Sitesi",
                desc: "Profilinden otomatik portfolyo sayfası oluştur, /p/kullanici-adi ile paylaş.",
              },
              {
                icon: Briefcase,
                title: "İlan Eşleştirme",
                desc: "İş ilanlarını profilinle karşılaştır, uyum skorunu ve eksiklerini gör.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Social proof placeholder */}
          <div className="mt-14 flex items-center gap-6 text-slate-500 text-sm">
            {["Güvenli (Supabase RLS)", "Kredi tabanlı — sadece kullandığın kadar", "Türkçe arayüz"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                {t}
              </span>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Profil, portfolyo, ilanlar ve kümülatif harcamayı paralel çek (RLS sahibe sınırlar).
  const [profileRes, portfolioRes, jobsRes, usageRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("portfolios")
      .select("slug, published, content")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_listings")
      .select("id, title, company, platform, status, match_score, match_result, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("usage_events").select("cost_usd").eq("user_id", user.id),
  ]);

  const initialProfile = profileRes.data
    ? {
        headline: profileRes.data.headline as string,
        summary: profileRes.data.summary as string,
        skills: (profileRes.data.skills as string[]) ?? [],
      }
    : null;

  const initialPortfolio = portfolioRes.data
    ? {
        slug: portfolioRes.data.slug as string,
        published: portfolioRes.data.published as boolean,
        content: portfolioRes.data.content ?? null,
      }
    : null;

  const initialJobs = (jobsRes.data ?? []) as Parameters<typeof ProfileStudio>[0]["initialJobs"];

  const initialSpendUsd = (usageRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.cost_usd ?? 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Multifolio</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
                Çıkış
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <ProfileStudio
          initialProfile={initialProfile}
          initialSpendUsd={initialSpendUsd}
          initialPortfolio={initialPortfolio}
          initialJobs={initialJobs}
        />
      </main>
    </div>
  );
}
