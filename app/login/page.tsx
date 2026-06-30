"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Star, Pencil, Sparkles, Target, LayoutDashboard, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlatformId } from "@/lib/ai/platforms";

/* ─── Static data ─────────────────────────────────────────────── */
const FEATURES = [
  { text: "Profilini bir kez gir, çoklu platform için uyarla", Icon: Pencil },
  { text: "Yapay Zeka ile profesyonel portfolyo oluştur",       Icon: Sparkles },
  { text: "İş ilanlarına mükemmel uyumu anında gör",            Icon: Target },
  { text: "Tüm başvurularını tek bir panelden takip et",         Icon: LayoutDashboard },
];

const PLATFORMS: PlatformId[] = ["linkedin", "upwork", "fiverr", "bionluk", "armut"];

interface HubPlatform {
  id: PlatformId;
  style: { top?: string; bottom?: string; left?: string; right?: string };
  delay: string;
}

const HUB_PLATFORMS: HubPlatform[] = [
  { id: "linkedin", style: { top: "8%",    left: "8%"   }, delay: "0s"   },
  { id: "upwork",   style: { top: "8%",    right: "8%"  }, delay: "0.7s" },
  { id: "fiverr",   style: { top: "42%",   right: "2%"  }, delay: "1.4s" },
  { id: "bionluk",  style: { bottom: "8%", right: "16%" }, delay: "2.1s" },
  { id: "armut",    style: { bottom: "8%", left: "16%"  }, delay: "2.8s" },
];

const LINE_ENDPOINTS = [
  { x2: "14", y2: "14" },  // linkedin
  { x2: "86", y2: "14" },  // upwork
  { x2: "92", y2: "50" },  // fiverr
  { x2: "78", y2: "86" },  // bionluk
  { x2: "22", y2: "86" },  // armut
];

/* ─── Platform hub mockup (full-height) ───────────────────────── */
function PlatformHubMockup() {
  return (
    <div
      className="w-full h-full flex flex-col rounded-3xl overflow-hidden
                 border border-slate-200/80 dark:border-white/10
                 bg-white/80 dark:bg-white/[0.04]
                 shadow-[0_20px_60px_-10px] shadow-slate-300/50 dark:shadow-black/70
                 backdrop-blur-md"
    >
      {/* Browser chrome */}
      <div
        className="flex-none flex items-center gap-1.5 px-5 py-3
                   border-b border-slate-100 dark:border-white/6
                   bg-slate-50 dark:bg-white/[0.03]"
      >
        <div className="h-3 w-3 rounded-full bg-red-400/80" />
        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
        <div className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="ml-3 text-xs font-medium text-slate-400 dark:text-white/25 tracking-tight">
          multifolio.app/studio
        </span>
      </div>

      {/* Hub area — fills remaining height */}
      <div className="relative flex-1 min-h-[220px]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 rounded-full blur-[80px]
                          bg-indigo-300/45 dark:bg-[#00F0FF]/18" />
        </div>

        {/* Connecting lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hubLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          {LINE_ENDPOINTS.map(({ x2, y2 }, i) => (
            <line
              key={i}
              x1="50" y1="50"
              x2={x2} y2={y2}
              stroke="url(#hubLineGrad)"
              strokeWidth="0.8"
              className="login-line"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </svg>

        {/* Central M hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center hub-glow
                       bg-gradient-to-br from-indigo-50 to-violet-100
                       dark:from-[#00F0FF]/20 dark:to-violet-600/25
                       border border-indigo-300/60 dark:border-[#00F0FF]/40
                       shadow-lg shadow-indigo-300/40 dark:shadow-[#00F0FF]/25"
          >
            <span className="text-indigo-600 dark:text-[#00F0FF] font-extrabold text-2xl">M</span>
          </div>
        </div>

        {/* Orbiting platform icons */}
        {HUB_PLATFORMS.map(({ id, style, delay }) => (
          <div
            key={id}
            className="absolute z-10 platform-float"
            style={{ ...style, animationDelay: delay }}
          >
            <div
              className="h-13 w-13 rounded-xl p-2
                         border border-slate-200 dark:border-white/10
                         bg-white dark:bg-white/8
                         shadow-lg shadow-slate-200/60 dark:shadow-black/40
                         backdrop-blur-sm"
            >
              <PlatformLogo platform={id} size={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sparkle decoration ──────────────────────────────────────── */
function SparkleDecor({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M16 2 L17.8 13.2 L28 16 L17.8 18.8 L16 30 L14.2 18.8 L4 16 L14.2 13.2 Z"
        fill="url(#sparkDecorGrad)"
      />
      <defs>
        <linearGradient id="sparkDecorGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══════════════════════════════════════════════════════════
          LEFT PANEL — light/dark responsive hero
      ══════════════════════════════════════════════════════════ */}
      <div
        className="relative lg:w-[58%] flex flex-col overflow-hidden
                   bg-slate-50 dark:bg-[#080A10]
                   px-8 pt-8 pb-8 lg:px-12 lg:pt-10 lg:pb-8"
      >
        {/* Light-mode gradient overlay */}
        <div className="pointer-events-none absolute inset-0 dark:hidden
                        bg-gradient-to-br from-indigo-50/80 via-white/30 to-violet-50/50" />

        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="login-blob-1 absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full blur-[110px]
                          bg-indigo-200/50 dark:bg-[#00F0FF]/10" />
          <div className="login-blob-2 absolute top-1/2 -right-24 h-[440px] w-[440px] rounded-full blur-[95px]
                          bg-violet-200/50 dark:bg-violet-600/12" />
          <div className="login-blob-3 absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full blur-[90px]
                          bg-blue-200/40 dark:bg-indigo-600/10" />
          {/* Dot grid */}
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="left-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5"
                  className="fill-slate-300/60 dark:fill-white/[0.035]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#left-dots)" />
          </svg>
        </div>

        {/* ── Logo ── */}
        <div className="relative anim-fade-in anim-d0 flex items-center gap-3 flex-none">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center
                       bg-indigo-100 dark:bg-[#00F0FF]/15
                       border border-indigo-200 dark:border-[#00F0FF]/30
                       shadow shadow-indigo-200/60 dark:shadow-[#00F0FF]/20"
          >
            <span className="text-indigo-600 dark:text-[#00F0FF] text-sm font-extrabold">M</span>
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
            Multifolio
          </span>
        </div>

        {/* ══ DESKTOP LAYOUT ══ */}
        <div className="relative hidden lg:flex flex-col flex-1 min-h-0 justify-center gap-8 py-4">

          {/* ① Badge + Headline — tam genişlik */}
          <div className="flex-none space-y-3 anim-fade-up anim-d1">
            {/* Stars badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5
                         border border-indigo-200 dark:border-[#00F0FF]/20
                         bg-indigo-50 dark:bg-[#00F0FF]/8"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-white/65">
                Beta — İlk 100 kullanıcı ücretsiz
              </span>
            </div>

            {/* Headline — 2 sütun genişliğinde */}
            <h1 className="anim-fade-up anim-d2 text-[2.75rem] font-extrabold tracking-[-0.005em] leading-[1.12]">
              <span className="text-slate-900 dark:text-white">Freelancer kariyerini </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500
                                 dark:from-[#00F0FF] dark:to-violet-400
                                 bg-clip-text text-transparent font-black">
                  tek platformdan{" "}
                </span>
                <span className="pointer-events-none absolute -bottom-1 left-0 right-[0.25em] h-[2px] rounded-full
                                 bg-gradient-to-r from-indigo-400 to-violet-400
                                 dark:from-[#00F0FF] dark:to-violet-400 opacity-50" />
              </span>
              <span className="text-slate-900 dark:text-white">yönet.</span>
            </h1>
          </div>

          {/* ② 2-sütun: Features | Büyük mockup */}
          <div className="grid grid-cols-[5fr_7fr] gap-6 items-center">

            {/* Sol: 4 özellik */}
            <div className="flex flex-col justify-center space-y-5 anim-fade-up anim-d3">
              {FEATURES.map(({ text, Icon }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 shrink-0 h-6 w-6 rounded-lg flex items-center justify-center
                               border border-indigo-200 dark:border-[#00F0FF]/25
                               bg-indigo-50 dark:bg-[#00F0FF]/10"
                  >
                    <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-[#00F0FF]" />
                  </div>
                  <span className="text-base font-medium leading-relaxed
                                   text-slate-600 dark:text-white/65">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Sağ: animasyonlu platform hub — orta boy */}
            <div className="anim-scale-in anim-d3 h-[300px] self-center">
              <PlatformHubMockup />
            </div>
          </div>

          {/* ③ Platform logoları — ortalı */}
          <div className="flex-none text-center space-y-3 anim-fade-up anim-d5 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]
                          text-slate-400 dark:text-white/25">
              Desteklenen platformlar
            </p>
            <div className="flex items-center justify-center gap-2.5">
              {PLATFORMS.map((id) => (
                <div
                  key={id}
                  className="h-10 w-10 rounded-xl flex items-center justify-center p-1.5
                             border border-slate-200 dark:border-white/15
                             bg-white dark:bg-white/8
                             shadow-md shadow-slate-200/70 dark:shadow-black/30
                             ring-1 ring-slate-100/80 dark:ring-white/5
                             hover:scale-110 hover:shadow-lg hover:shadow-indigo-100/60
                             dark:hover:shadow-[#00F0FF]/10
                             transition-all duration-200"
                >
                  <PlatformLogo platform={id} size={22} />
                </div>
              ))}
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center
                           border border-dashed border-slate-300 dark:border-white/15
                           bg-slate-50 dark:bg-white/4
                           text-slate-400 dark:text-white/35 text-sm font-bold"
              >
                +
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile: compact tagline ── */}
        <div className="relative lg:hidden mt-5 space-y-2">
          <p className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-white">
            Tek profil.{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500
                             dark:from-[#00F0FF] dark:to-violet-400 bg-clip-text text-transparent">
              5 platform.
            </span>
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-white/50">
            Freelancer kariyerini tek yerden yönet.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT PANEL — dot-grid + floating form card
      ══════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 relative flex items-center justify-center
                   px-6 py-10 lg:py-0
                   bg-slate-100 dark:bg-[#0D0F18]"
      >
        {/* Dot grid */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="right-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1"
                className="fill-slate-400/35 dark:fill-white/[0.055]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#right-dots)" />
        </svg>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                          h-[400px] w-[400px] rounded-full blur-[120px]
                          bg-indigo-100/60 dark:bg-violet-600/6" />
        </div>

        {/* Theme toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Decorative sparkles */}
        <div className="absolute bottom-8 right-8 z-10 anim-sparkle">
          <SparkleDecor className="opacity-25 dark:opacity-15" />
        </div>
        <div className="absolute top-16 left-8 z-10 anim-sparkle" style={{ animationDelay: "1.8s" }}>
          <SparkleDecor className="opacity-15 dark:opacity-10 scale-[0.6]" />
        </div>

        {/* ── Floating form card ── */}
        <div
          className="relative z-10 w-full max-w-[390px] login-form-in
                     rounded-2xl p-8
                     border border-white/90 dark:border-white/8
                     bg-white dark:bg-[#161B2C]
                     shadow-2xl shadow-slate-200/70 dark:shadow-black/60"
        >
          {status === "sent" ? (
            /* ── Success state ── */
            <div className="space-y-6 text-center anim-scale-in">
              <div
                className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center
                           bg-indigo-50 dark:bg-[#00F0FF]/10
                           border border-indigo-100 dark:border-[#00F0FF]/20"
              >
                <Mail className="h-7 w-7 text-indigo-500 dark:text-[#00F0FF]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">E-postanı kontrol et</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{email}</span> adresine
                  giriş bağlantısı gönderdik. Spam klasörünü de kontrol et.
                </p>
              </div>
              <button
                onClick={() => setStatus("idle")}
                className="text-sm text-muted-foreground hover:text-foreground
                           underline underline-offset-2 transition-colors"
              >
                Farklı e-posta ile dene
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Mobile-only logo */}
              <div className="lg:hidden mb-6 flex items-center justify-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center
                             bg-indigo-100 dark:bg-[#00F0FF]/15
                             border border-indigo-200 dark:border-[#00F0FF]/30"
                >
                  <span className="text-indigo-600 dark:text-[#00F0FF] text-sm font-extrabold">M</span>
                </div>
                <span className="font-bold text-base text-foreground">Multifolio</span>
              </div>

              {/* Heading */}
              <div className="text-center mb-8 space-y-3 anim-fade-up anim-d0">
                <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">
                  Giriş yap
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  E-postana sihirli bağlantı gönderilecek.{" "}
                  <span className="font-medium text-foreground/55">Şifre gerekmez.</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4 anim-fade-up anim-d1">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    E-posta adresi
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sen@ornek.com"
                    className="h-11 transition-shadow focus:shadow-md focus:shadow-primary/10"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-destructive">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer
                             flex items-center justify-center
                             bg-[#00F0FF] hover:bg-[#00d8e8] active:bg-[#00c8d6]
                             text-[#080A10]
                             shadow-lg shadow-[#00F0FF]/20
                             hover:shadow-xl hover:shadow-[#00F0FF]/30
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 px-4"
                >
                  {status === "sending" ? (
                    "Gönderiliyor…"
                  ) : (
                    <>
                      <span className="flex-1 text-center">Bağlantı gönder</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </>
                  )}
                </button>
              </form>

              {/* Legal + back */}
              <div className="mt-7 space-y-4 anim-fade-in anim-d2">
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  Devam ederek{" "}
                  <a href="#"
                    className="underline underline-offset-2 hover:text-foreground transition-colors">
                    Kullanım Şartları
                  </a>
                  {" "}ve{" "}
                  <a href="#"
                    className="underline underline-offset-2 hover:text-foreground transition-colors">
                    Gizlilik Politikası
                  </a>
                  {"'"}nı kabul etmiş olursun.
                </p>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5
                             text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Ana sayfaya dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
