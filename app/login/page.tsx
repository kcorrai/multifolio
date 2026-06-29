"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Star, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlatformId } from "@/lib/ai/platforms";

const FEATURES = [
  "Profilini bir kez gir, 5 platform için uyarla",
  "AI ile saniyeler içinde portfolyo oluştur",
  "İlanlarla uyum skorunu anında gör",
  "Başvurularını tek ekrandan takip et",
];

const PLATFORMS: PlatformId[] = ["linkedin", "upwork", "fiverr", "bionluk", "armut"];

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
          LEFT PANEL — always-dark hero with animated blobs
      ══════════════════════════════════════════════════════════ */}
      <div className="relative lg:w-[55%] flex flex-col overflow-hidden bg-[#080A10]
                      px-8 pt-8 pb-10 lg:px-14 lg:pt-12 lg:pb-12">

        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="login-blob-1 absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-[#00F0FF]/10 blur-[110px]" />
          <div className="login-blob-2 absolute top-1/2 -right-24 h-[440px] w-[440px] rounded-full bg-violet-600/12 blur-[95px]" />
          <div className="login-blob-3 absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[90px]" />
          {/* Subtle dot grid */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-dot-grid)" />
          </svg>
        </div>

        {/* ── Logo ── */}
        <div className="relative anim-fade-in anim-d0 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30
                          flex items-center justify-center shadow-lg shadow-[#00F0FF]/20">
            <span className="text-[#00F0FF] text-sm font-extrabold">M</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Multifolio</span>
        </div>

        {/* ── Desktop: full hero content ── */}
        <div className="relative hidden lg:flex flex-col justify-center flex-1 space-y-9 py-6">

          {/* Stars badge */}
          <div className="anim-fade-up anim-d1 inline-flex w-fit items-center gap-2
                          rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/8
                          px-4 py-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <span className="text-xs font-semibold text-white/65">
              Beta — İlk 100 kullanıcı ücretsiz
            </span>
          </div>

          {/* Headline */}
          <div className="anim-fade-up anim-d2 space-y-1">
            <h1 className="text-[2.7rem] font-extrabold leading-[1.1] tracking-tight text-white">
              Freelancer kariyerini
            </h1>
            <h1 className="text-[2.7rem] font-extrabold leading-[1.1] tracking-tight
                           bg-gradient-to-r from-[#00F0FF] to-violet-400 bg-clip-text text-transparent">
              tek platformdan
            </h1>
            <h1 className="text-[2.7rem] font-extrabold leading-[1.1] tracking-tight text-white">
              yönet.
            </h1>
          </div>

          {/* Feature list */}
          <ul className="anim-fade-up anim-d3 space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3.5">
                <div className="shrink-0 h-5 w-5 rounded-full
                                bg-[#00F0FF]/12 border border-[#00F0FF]/25
                                flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-[#00F0FF]" />
                </div>
                <span className="text-sm text-white/65 font-medium leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

          {/* Platform logos */}
          <div className="anim-fade-up anim-d4 space-y-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
              Desteklenen platformlar
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PLATFORMS.map((id) => (
                <div
                  key={id}
                  className="rounded-xl border border-white/10 bg-white/[0.06]
                             p-2.5 hover:bg-white/[0.11] hover:border-white/18
                             transition-colors duration-200"
                >
                  <PlatformLogo platform={id} size={18} />
                </div>
              ))}
              <span className="text-xs text-white/25 font-medium ml-1">5 platform</span>
            </div>
          </div>
        </div>

        {/* ── Mobile: compact tagline ── */}
        <div className="relative lg:hidden mt-5 space-y-2">
          <p className="text-2xl font-extrabold text-white leading-tight">
            Tek profil.{" "}
            <span className="bg-gradient-to-r from-[#00F0FF] to-violet-400 bg-clip-text text-transparent">
              5 platform.
            </span>
          </p>
          <p className="text-sm text-white/50 font-medium">
            Freelancer kariyerini tek yerden yönet.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT PANEL — adaptive form (light / dark)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center
                      px-6 py-12 lg:py-0 bg-background relative">

        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[380px] login-form-in">

          {status === "sent" ? (
            /* ── Success state ── */
            <div className="space-y-6 anim-scale-in">
              <div className="mx-auto h-16 w-16 rounded-2xl
                              bg-[#00F0FF]/10 border border-[#00F0FF]/20
                              flex items-center justify-center">
                <Mail className="h-7 w-7 text-[#00F0FF]" />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-foreground">E-postanı kontrol et</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{email}</span> adresine giriş
                  bağlantısı gönderdik. Spam klasörünü de kontrol et.
                </p>
              </div>
              <button
                onClick={() => setStatus("idle")}
                className="w-full text-sm text-muted-foreground hover:text-foreground
                           underline underline-offset-2 transition-colors"
              >
                Farklı e-posta ile dene
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Mobile-only logo */}
              <div className="lg:hidden mb-8 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center
                                shadow shadow-primary/30">
                  <span className="text-primary-foreground text-sm font-extrabold">M</span>
                </div>
                <span className="font-bold text-base text-foreground">Multifolio</span>
              </div>

              {/* Heading */}
              <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Giriş yap
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  E-postana sihirli bağlantı gönderilecek.{" "}
                  <span className="font-medium text-foreground/55">Şifre gerekmez.</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
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
                             bg-[#00F0FF] hover:bg-[#00d8e8] active:bg-[#00c8d6]
                             text-[#080A10]
                             shadow-lg shadow-[#00F0FF]/20
                             hover:shadow-xl hover:shadow-[#00F0FF]/30
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200
                             flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    "Gönderiliyor…"
                  ) : (
                    <>
                      Bağlantı gönder
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Trust note */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  Devam ederek{" "}
                  <a
                    href="#"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Kullanım Şartları
                  </a>
                  {" "}ve{" "}
                  <a
                    href="#"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Gizlilik Politikası
                  </a>
                  {"'"}nı kabul etmiş olursun.
                </p>
              </div>
            </>
          )}

          {/* Back link */}
          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-1.5
                       text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
