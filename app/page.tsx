import Link from "next/link";
import {
  Layers, Globe, Briefcase, ArrowRight, LogOut,
  CheckCircle2, Target, Sparkles, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileStudio } from "@/components/profile-studio";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlatformId } from "@/lib/ai/platforms";

/* ─── Product mockup shown in hero ─────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative anim-scale-in anim-d3">
      {/* Dual-tone glow behind mockup */}
      <div className="absolute -inset-4 rounded-3xl bg-[#00F0FF]/10 blur-3xl" />
      <div className="absolute -inset-6 rounded-3xl bg-violet-500/10 blur-[60px]" />

      <div className="relative rounded-2xl border border-white/10 bg-[#161923] shadow-2xl overflow-hidden">
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
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { id: "linkedin" as PlatformId, name: "LinkedIn",  done: true },
              { id: "upwork"   as PlatformId, name: "Upwork",    done: true },
              { id: "fiverr"   as PlatformId, name: "Fiverr",    done: true },
              { id: "bionluk"  as PlatformId, name: "Bionluk",   done: false },
              { id: "armut"    as PlatformId, name: "Armut",     done: false },
            ]).map(({ id, name, done }) => (
              <div key={name} className="rounded-lg border border-white/8 bg-white/[0.03] p-2 flex items-center gap-1.5">
                <PlatformLogo platform={id} size={12} />
                <span className="text-[9px] text-white/50 font-medium flex-1 truncate">{name}</span>
                <span className={`text-[8px] px-1 py-0.5 rounded font-semibold shrink-0 ${done ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/25"}`}>
                  {done ? "✓" : "…"}
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">

      {/* Nav */}
      <header className="border-b border-slate-200 dark:border-white/5 anim-fade-in anim-d0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center shadow-lg shadow-[#00F0FF]/20">
              <span className="text-[#00F0FF] text-sm font-extrabold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Multifolio</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {["Özellikler", "Nasıl Çalışır", "Fiyat"].map((item) => (
              <a key={item} href="#" className="text-sm text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8">
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button asChild size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30">
              <Link href="/login">Ücretsiz Başla</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
          <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            {/* Badge */}
            <div className="anim-fade-up anim-d0 inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-3.5 py-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-white/70">Beta — İlk 100 kullanıcı ücretsiz</span>
            </div>

            {/* H1 */}
            <h1 className="anim-fade-up anim-d1 text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              Freelancer kariyerini{" "}
              <span className="bg-gradient-to-r from-[#00F0FF] to-violet-400 bg-clip-text text-transparent">
                tek platformdan
              </span>{" "}
              yönet.
            </h1>

            {/* Description */}
            <p className="anim-fade-up anim-d2 text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-md font-medium">
              Profilini bir kez gir. LinkedIn, Upwork, Fiverr, Bionluk ve Armut
              için AI ile optimize et; portfolyonu saniyeler içinde yayınla.
            </p>

            {/* Platform logo pills — hero */}
            <div className="anim-fade-up anim-d3 flex items-center gap-2 flex-wrap pt-1">
              {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id) => (
                <div key={id} className="rounded-lg border border-white/8 bg-white/[0.05] p-1.5 backdrop-blur-sm">
                  <PlatformLogo platform={id} size={16} />
                </div>
              ))}
              <span className="text-xs text-slate-400 dark:text-[#94A3B8]/60 font-medium">5 platform destekleniyor</span>
            </div>

            {/* CTA buttons */}
            <div className="anim-fade-up anim-d4 flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="anim-neon-pulse inline-flex items-center h-12 px-7 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors"
              >
                Hemen Başla <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center h-12 px-7 rounded-xl text-base font-semibold border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                Özellikleri Gör
              </Link>
            </div>

            {/* Trust signals */}
            <div className="anim-fade-up anim-d5 flex flex-wrap gap-4 pt-1">
              {["Kredi kartı gerekmez", "5 dakikada kur", "Pay-as-you-go"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-[#94A3B8]/70 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00F0FF] shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <ScrollReveal>
        <div className="border-y border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#161923]/60">
          <div className="mx-auto max-w-6xl px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "5",      label: "Desteklenen Platform", color: "text-[#00F0FF]" },
              { value: "%89",    label: "Ort. Uyum Skoru",      color: "text-violet-400" },
              { value: "GPT-4o", label: "Güçlü Motor",          color: "text-[#00F0FF]" },
              { value: "2 dk",   label: "İlk Uyarlama",         color: "text-violet-400" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center space-y-1">
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 dark:text-[#94A3B8]/50 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Platforms strip */}
      <ScrollReveal className="mx-auto max-w-6xl px-8 py-14">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-8">
          Desteklenen platformlar
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {([
            { id: "linkedin" as PlatformId, label: "LinkedIn", delay: 0   },
            { id: "upwork"   as PlatformId, label: "Upwork",   delay: 60  },
            { id: "fiverr"   as PlatformId, label: "Fiverr",   delay: 120 },
            { id: "bionluk"  as PlatformId, label: "Bionluk",  delay: 180 },
            { id: "armut"    as PlatformId, label: "Armut",    delay: 240 },
          ]).map(({ id, label }) => (
            <div key={id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.05] px-5 py-3 backdrop-blur-sm hover:bg-white/[0.09] hover:border-white/15 transition-colors">
              <PlatformLogo platform={id} size={20} />
              <span className="text-sm font-semibold text-slate-700 dark:text-[#94A3B8]">{label}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-8 pb-24">
        <ScrollReveal>
          <div className="text-center space-y-3 mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">Özellikler</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Her şey tek bir yerde.</h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">
              Freelancer olarak ihtiyacın olan tüm araçlar, birbirine bağlı ve otomatik.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Platform Uyarlama — özel kart */}
          <ScrollReveal delay={0}>
            <div className="group h-full rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 space-y-4 hover:border-[#00F0FF]/30 dark:hover:border-[#00F0FF]/20 hover:shadow-md hover:shadow-[#00F0FF]/5 transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-[#00F0FF]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">Platform Uyarlama</h3>
                <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">
                  Profilini bir kez yaz. AI her platform için ayrı optimize eder — tona, dile ve beklentiye göre.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id) => (
                  <div key={id} className="rounded-lg border border-white/8 bg-white/[0.05] p-1.5">
                    <PlatformLogo platform={id} size={14} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {[
            { icon: Globe,        title: "Portfolyo Sitesi",  desc: "/p/kullanici-adin adresinde yayınlanan, SEO'ya uygun kişisel portfolyo sayfası. OG etiketleriyle sosyal paylaşıma hazır.", accent: "violet", delay: 60  },
            { icon: Briefcase,    title: "İlan Eşleştirme",  desc: "İlanı yapıştır; profilinle karşılaştırır, 0-100 uyum skoru verir, güçlü yönlerini ve eksiklerini listeler.",             accent: "cyan",   delay: 120 },
            { icon: Target,       title: "Başvuru Takibi",   desc: "Kaydedildi → Başvuruldu → Görüşme → Teklif pipeline'ı. Tüm başvurularını tek ekrandan yönet.",                           accent: "violet", delay: 180 },
            { icon: Sparkles,     title: "AI ile Üretim",    desc: "GPT-4o mini destekli; structured output ile her seferinde doğru format ve platform diline uygun içerik.",                 accent: "cyan",   delay: 240 },
            { icon: CheckCircle2, title: "Güvenli & Hızlı",  desc: "Supabase RLS ile her veri sahibine özel. Pay-as-you-go model: yalnızca kullandığın kadar öde.",                          accent: "violet", delay: 300 },
          ].map(({ icon: Icon, title, desc, accent, delay }) => (
            <ScrollReveal key={title} delay={delay}>
              <div className="group h-full rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 space-y-4 hover:border-violet-500/20 hover:shadow-md transition-all">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent === "cyan" ? "bg-[#00F0FF]/10 border border-[#00F0FF]/20" : "bg-violet-500/10 border border-violet-500/20"}`}>
                  <Icon className={`h-5 w-5 ${accent === "cyan" ? "text-[#00F0FF]" : "text-violet-400"}`} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#161923]/40 py-24">
        <div className="mx-auto max-w-6xl px-8">
          <ScrollReveal>
            <div className="text-center space-y-3 mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Nasıl Çalışır</p>
              <h2 className="text-4xl font-extrabold tracking-tight">3 adımda başla.</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Profilini gir",        desc: "Başlık, özet ve becerilerini bir kez doldur. Bu temel, her şeyin kaynağı.",                         delay: 0   },
              { step: "02", title: "Platform seç & uyarla", desc: "LinkedIn, Upwork veya diğer platformlar için AI'ın optimize metnini üret.",                         delay: 100 },
              { step: "03", title: "Paylaş & takip et",    desc: "Portfolyonu yayınla, başvurularını takip et, ilanları eşleştir.",                                   delay: 200 },
            ].map(({ step, title, desc, delay }) => (
              <ScrollReveal key={step} delay={delay}>
                <div className="space-y-4">
                  <div className="text-5xl font-extrabold text-slate-200 dark:text-white/6 tabular-nums">{step}</div>
                  <div className="h-px w-12 bg-gradient-to-r from-[#00F0FF] to-violet-400" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-8 py-24 text-center">
        <ScrollReveal scale>
          <div className="relative rounded-3xl border border-[#00F0FF]/15 dark:border-[#00F0FF]/10 bg-slate-50 dark:bg-[#161923] px-8 py-16 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#00F0FF]/6 blur-[80px]" />
              <div className="absolute right-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[80px]" />
            </div>
            <div className="relative space-y-5">
              <h2 className="text-4xl font-extrabold tracking-tight">
                Freelancer kariyerini bir üst seviyeye taşı.
              </h2>
              <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-md mx-auto">
                Beta sürecinde ücretsiz. Kredi kartı gerekmez.
              </p>
              <Link
                href="/login"
                className="anim-neon-pulse inline-flex items-center h-12 px-8 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors mt-2"
              >
                Ücretsiz Başla <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
              <span className="text-[#00F0FF] text-[9px] font-extrabold">M</span>
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-[#94A3B8]/50">Multifolio</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-white/20 font-medium">© 2026 Multifolio. Tüm hakları saklıdır.</p>
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

  const [profileRes, portfolioRes, jobsRes, usageRes, creditsRes, connectionsRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("kind, platform, cost_usd, input_tokens, output_tokens, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("platform, profile_url, updated_at").eq("user_id", user.id),
  ]);

  const initialProfile = profileRes.data
    ? { headline: profileRes.data.headline as string, summary: profileRes.data.summary as string, skills: (profileRes.data.skills as string[]) ?? [] }
    : null;

  const initialPortfolio = portfolioRes.data
    ? { slug: portfolioRes.data.slug as string, published: portfolioRes.data.published as boolean, content: portfolioRes.data.content ?? null }
    : null;

  const initialJobs = (jobsRes.data ?? []) as Parameters<typeof ProfileStudio>[0]["initialJobs"];
  const initialCredits = creditsRes.data?.balance ?? 0;
  const initialConnections = Object.fromEntries(
    (connectionsRes.data ?? []).map((c) => [c.platform, c.profile_url as string])
  ) as Record<string, string>;

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
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-extrabold">M</span>
            </div>
            <span className="font-bold text-sm tracking-tight">Multifolio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-muted-foreground font-medium">{user.email}</span>
            <ThemeToggle />
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
          initialCredits={initialCredits}
          initialConnections={initialConnections}
        />
      </main>
    </div>
  );
}
