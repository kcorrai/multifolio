import Link from "next/link";
import {
  Layers, Globe, Briefcase, ArrowRight, LogOut,
  CheckCircle2, Target, Sparkles, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileStudio } from "@/components/profile-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ─── Product mockup shown in hero ─────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative">
      {/* Glow behind mockup */}
      <div className="absolute -inset-4 rounded-3xl bg-indigo-500/20 blur-3xl" />

      <div className="relative rounded-2xl border border-white/10 bg-[#0d0d18] shadow-2xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-white/25 font-medium">Multifolio — Profil Stüdyosu</span>
          <span className="ml-auto text-[10px] text-indigo-400 font-semibold tabular-nums">$0.0042</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {["Profil", "Platform", "Portfolyo", "İlanlar"].map((t, i) => (
              <div key={t} className={`flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-semibold ${i === 0 ? "bg-white/10 text-white" : "text-white/30"}`}>
                {t}
              </div>
            ))}
          </div>

          {/* Profile card */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-white">Senior React Developer</p>
                <p className="text-[10px] text-white/40 mt-0.5">5+ yıl · TypeScript · Next.js uzmanı</p>
              </div>
              <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">Kaydedildi ✓</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {["React", "TypeScript", "Next.js", "Node.js", "GraphQL"].map((s) => (
                <span key={s} className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">{s}</span>
              ))}
            </div>
          </div>

          {/* Platform results */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "LinkedIn", done: true },
              { name: "Upwork", done: true },
            ].map(({ name, done }) => (
              <div key={name} className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5 flex items-center justify-between">
                <span className="text-[10px] text-white/50 font-medium">{name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${done ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/30"}`}>
                  {done ? "✓ Hazır" : "Bekliyor"}
                </span>
              </div>
            ))}
          </div>

          {/* Match score */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/50 font-medium">Senior Dev · Acme Corp</p>
                <p className="text-[9px] text-white/25">İlan eşleştirme sonucu</p>
              </div>
              <span className="text-lg font-extrabold text-green-400 tabular-nums">87<span className="text-xs font-normal text-white/30">/100</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: "87%" }} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="space-y-0.5">
                <p className="text-[9px] text-green-400 font-semibold">Güçlü</p>
                <p className="text-[9px] text-white/30">· React uzmanlığı</p>
                <p className="text-[9px] text-white/30">· TypeScript deneyimi</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-red-400 font-semibold">Eksik</p>
                <p className="text-[9px] text-white/30">· AWS sertifikası</p>
                <p className="text-[9px] text-white/30">· Go deneyimi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Landing page ──────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07070f] text-white">

      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <span className="text-white text-sm font-extrabold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Multifolio</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {["Özellikler", "Nasıl Çalışır", "Fiyat"].map((item) => (
              <a key={item} href="#" className="text-sm text-white/50 hover:text-white transition-colors font-medium">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8">
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button asChild size="sm" className="font-semibold shadow-lg shadow-indigo-500/30">
              <Link href="/login">Ücretsiz Başla</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-6">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-white/70">Beta — İlk 100 kullanıcı ücretsiz</span>
            </div>

            <h1 className="text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              Freelancer kariyerini{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                tek platformdan
              </span>{" "}
              yönet.
            </h1>

            <p className="text-lg text-white/50 leading-relaxed max-w-md font-medium">
              Profilini bir kez gir. LinkedIn, Upwork ve daha fazlası için Claude AI
              ile optimize et; portfolyonu saniyeler içinde yayınla.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="h-12 px-7 text-base font-bold shadow-xl shadow-indigo-500/30">
                <Link href="/login">
                  Hemen Başla <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg"
                className="h-12 px-7 text-base font-semibold border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/25">
                <Link href="#features">Özellikleri Gör</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              {["Kredi kartı gerekmez", "5 dakikada kur", "Pay-as-you-go"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/40 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — product mockup */}
          <div className="hidden lg:block">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "5", label: "Desteklenen Platform" },
            { value: "%89", label: "Ort. Uyum Skoru" },
            { value: "Claude AI", label: "Güçlü Motor" },
            { value: "2 dk", label: "İlk Uyarlama" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-xs text-white/35 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-8 py-24">
        <div className="text-center space-y-3 mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Özellikler</p>
          <h2 className="text-4xl font-extrabold tracking-tight">Her şey tek bir yerde.</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto font-medium">
            Freelancer olarak ihtiyacın olan tüm araçlar, birbirine bağlı ve otomatik.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Layers,
              title: "Platform Uyarlama",
              desc: "Profilini bir kez yaz. Claude AI her platform için ayrı optimize eder — LinkedIn'in resmi tonu, Upwork'ün sonuç odaklı dili.",
              accent: "indigo",
            },
            {
              icon: Globe,
              title: "Portfolyo Sitesi",
              desc: "/p/kullanici-adin adresinde yayınlanan, SEO'ya uygun kişisel portfolyo sayfası. OG etiketleriyle sosyal paylaşıma hazır.",
              accent: "violet",
            },
            {
              icon: Briefcase,
              title: "İlan Eşleştirme",
              desc: "İlanı yapıştır; profilinle karşılaştırır, 0-100 uyum skoru verir, güçlü yönlerini ve eksiklerini listeler.",
              accent: "indigo",
            },
            {
              icon: Target,
              title: "Başvuru Takibi",
              desc: "Kaydedildi → Başvuruldu → Görüşme → Teklif pipeline'ı. Tüm başvurularını tek ekrandan yönet.",
              accent: "violet",
            },
            {
              icon: Sparkles,
              title: "AI ile Üretim",
              desc: "Anthropic Claude ile çalışır; adaptive thinking ve structured output ile her seferinde doğru format.",
              accent: "indigo",
            },
            {
              icon: CheckCircle2,
              title: "Güvenli & Hızlı",
              desc: "Supabase RLS ile her veri sahibine özel. Pay-as-you-go model: yalnızca kullandığın kadar öde.",
              accent: "violet",
            },
          ].map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4 hover:border-white/15 hover:bg-white/[0.04] transition-all"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent === "indigo" ? "bg-indigo-500/15" : "bg-violet-500/15"}`}>
                <Icon className={`h-5 w-5 ${accent === "indigo" ? "text-indigo-400" : "text-violet-400"}`} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-6xl px-8">
          <div className="text-center space-y-3 mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Nasıl Çalışır</p>
            <h2 className="text-4xl font-extrabold tracking-tight">3 adımda başla.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Profilini gir", desc: "Başlık, özet ve becerilerini bir kez doldur. Bu temel, her şeyin kaynağı." },
              { step: "02", title: "Platform seç & uyarla", desc: "LinkedIn, Upwork veya diğer platformlar için AI'ın optimize metnini üret." },
              { step: "03", title: "Paylaş & takip et", desc: "Portfolyonu yayınla, başvurularını takip et, ilanları eşleştir." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-4">
                <div className="text-5xl font-extrabold text-white/8 tabular-nums">{step}</div>
                <div className="h-px w-12 bg-indigo-500" />
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-8 py-24 text-center">
        <div className="relative rounded-3xl border border-indigo-500/20 bg-indigo-500/5 px-8 py-16 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[80px]" />
          </div>
          <div className="relative space-y-5">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Freelancer kariyerini bir üst seviyeye taşı.
            </h2>
            <p className="text-white/40 text-lg font-medium max-w-md mx-auto">
              Beta sürecinde ücretsiz. Kredi kartı gerekmez.
            </p>
            <Button asChild size="lg" className="h-12 px-8 text-base font-bold shadow-xl shadow-indigo-500/30 mt-2">
              <Link href="/login">
                Ücretsiz Başla <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-extrabold">M</span>
            </div>
            <span className="text-sm font-bold text-white/50">Multifolio</span>
          </div>
          <p className="text-xs text-white/20 font-medium">© 2026 Multifolio. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── App shell (authenticated) ────────────────────────────────── */
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <LandingPage />;

  const [profileRes, portfolioRes, jobsRes, usageRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("kind, platform, cost_usd, input_tokens, output_tokens, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const initialProfile = profileRes.data
    ? { headline: profileRes.data.headline as string, summary: profileRes.data.summary as string, skills: (profileRes.data.skills as string[]) ?? [] }
    : null;

  const initialPortfolio = portfolioRes.data
    ? { slug: portfolioRes.data.slug as string, published: portfolioRes.data.published as boolean, content: portfolioRes.data.content ?? null }
    : null;

  const initialJobs = (jobsRes.data ?? []) as Parameters<typeof ProfileStudio>[0]["initialJobs"];

  const usageRows = usageRes.data ?? [];
  const initialSpendUsd = usageRows.reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0);

  // Analitik: tür bazında özet ve son 30 günlük günlük harcama
  const byKind: Record<string, { count: number; costUsd: number }> = {};
  for (const r of usageRows) {
    const k = r.kind as string;
    byKind[k] ??= { count: 0, costUsd: 0 };
    byKind[k].count += 1;
    byKind[k].costUsd += Number(r.cost_usd ?? 0);
  }
  // eslint-disable-next-line react-hooks/purity
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const daily: Record<string, number> = {};
  for (const r of usageRows) {
    if (new Date(r.created_at as string).getTime() < cutoff) continue;
    const day = (r.created_at as string).slice(0, 10);
    daily[day] = (daily[day] ?? 0) + Number(r.cost_usd ?? 0);
  }
  const initialAnalytics = {
    totalUsd: initialSpendUsd,
    totalCount: usageRows.length,
    byKind,
    dailySeries: Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costUsd]) => ({ date, costUsd })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-extrabold">M</span>
            </div>
            <span className="font-bold text-sm tracking-tight">Multifolio</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground font-medium">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground font-medium">
                <LogOut className="h-3.5 w-3.5" />
                Çıkış
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <ProfileStudio
          initialProfile={initialProfile}
          initialSpendUsd={initialSpendUsd}
          initialPortfolio={initialPortfolio}
          initialJobs={initialJobs}
          initialAnalytics={initialAnalytics}
        />
      </main>
    </div>
  );
}
