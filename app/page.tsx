import Link from "next/link";
import {
  Layers, Globe, Briefcase, ArrowRight,
  CheckCircle2, Target, Sparkles, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlatformId } from "@/lib/ai/platforms";

/* ─── Circular progress ring ────────────────────────────────────── */
function CircleScore({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width="140" height="140" viewBox="0 0 130 130" className="-rotate-90">
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="9" />
      <circle
        cx="65" cy="65" r={r} fill="none"
        stroke="var(--ring-arc)" strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* ─── Score bar ─────────────────────────────────────────────────── */
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-white/50 font-medium">{label}</span>
        <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/6 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: "var(--ring-arc)" }} />
      </div>
    </div>
  );
}

/* ─── Product mockup shown in hero ─────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative flex items-center justify-center py-10 anim-fade-in anim-d2">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-indigo-400/8 dark:bg-cyan-400/8 blur-[90px]" />

      <div style={{ perspective: "1000px" }}>
        <div className="card-3d card-spin-in relative rounded-3xl bg-white dark:bg-[#161923] w-[380px] overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-[#00F0FF]/40" />

          <div className="px-6 pt-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-600 dark:text-white">AY</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Ahmet Yılmaz</p>
                <p className="text-[11px] text-slate-400 dark:text-white/40">Senior React Developer</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-[#00F0FF] bg-indigo-50 dark:bg-[#00F0FF]/10 border border-indigo-200 dark:border-[#00F0FF]/25 rounded-full px-2.5 py-1">
              ✦ AI
            </span>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="flex items-center gap-5 px-6 py-5">
            <div className="relative shrink-0">
              <CircleScore score={87} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-extrabold text-slate-900 dark:text-white leading-none">87</span>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--ring-arc)" }}>Güçlü</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold mb-2">Genel Skor</p>
              <p className="text-[12px] text-slate-500 dark:text-white/55 leading-relaxed">
                Güçlü profil. Başlık<br />optimizasyonu en büyük fırsat.
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="px-6 py-5 space-y-3.5">
            <ScoreBar label="Platform Uyumu"     value={92} />
            <ScoreBar label="Beceri Eşleşmesi"   value={88} />
            <ScoreBar label="Müşteri Çekiciliği"  value={76} />
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 mx-6" />

          <div className="px-6 py-5 flex items-center justify-between">
            {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id) => (
              <div key={id} className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.04] p-1.5">
                <PlatformLogo platform={id} size={16} />
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-indigo-500/20" />
        </div>
      </div>
    </div>
  );
}

/* ─── Landing page ──────────────────────────────────────────────── */
function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
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
            {isLoggedIn ? (
              <Button asChild size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8">
                  <Link href="/login">Giriş Yap</Link>
                </Button>
                <Button asChild size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                  <Link href="/login">Ücretsiz Başla</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
          <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="anim-fade-up anim-d0 inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-3.5 py-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-white/70">Beta — İlk 100 kullanıcı ücretsiz</span>
            </div>

            <h1 className="anim-fade-up anim-d1 text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              Freelancer kariyerini{" "}
              <span className="bg-gradient-to-r from-[#00F0FF] to-violet-400 bg-clip-text text-transparent">
                tek platformdan
              </span>{" "}
              yönet.
            </h1>

            <p className="anim-fade-up anim-d2 text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-md font-medium">
              Profilini bir kez gir. LinkedIn, Upwork, Fiverr, Bionluk ve Armut
              için AI ile optimize et; portfolyonu saniyeler içinde yayınla.
            </p>

            <div className="anim-fade-up anim-d3 flex items-center gap-2 flex-wrap pt-1">
              {(["linkedin","upwork","fiverr","bionluk","armut"] as PlatformId[]).map((id) => (
                <div key={id} className="rounded-lg border border-white/8 bg-white/[0.05] p-1.5 backdrop-blur-sm">
                  <PlatformLogo platform={id} size={16} />
                </div>
              ))}
              <span className="text-xs text-slate-400 dark:text-[#94A3B8]/60 font-medium">5 platform destekleniyor</span>
            </div>

            <div className="anim-fade-up anim-d4 flex flex-wrap items-center gap-3 pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="anim-neon-pulse inline-flex items-center h-12 px-7 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors"
                >
                  Dashboard&apos;a Git <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>

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
            { id: "linkedin" as PlatformId, label: "LinkedIn" },
            { id: "upwork"   as PlatformId, label: "Upwork"   },
            { id: "fiverr"   as PlatformId, label: "Fiverr"   },
            { id: "bionluk"  as PlatformId, label: "Bionluk"  },
            { id: "armut"    as PlatformId, label: "Armut"    },
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
              { step: "01", title: "Profilini gir",          desc: "Başlık, özet ve becerilerini bir kez doldur. Bu temel, her şeyin kaynağı.",        delay: 0   },
              { step: "02", title: "Platform seç & uyarla",  desc: "LinkedIn, Upwork veya diğer platformlar için AI'ın optimize metnini üret.",        delay: 100 },
              { step: "03", title: "Paylaş & takip et",      desc: "Portfolyonu yayınla, başvurularını takip et, ilanları eşleştir.",                  delay: 200 },
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
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="anim-neon-pulse inline-flex items-center h-12 px-8 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors mt-2"
              >
                {isLoggedIn ? "Dashboard'a Git" : "Ücretsiz Başla"} <ArrowRight className="ml-2 h-4 w-4" />
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

/* ─── Root server component ─────────────────────────────────────── */
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isLoggedIn={!!user} />;
}
