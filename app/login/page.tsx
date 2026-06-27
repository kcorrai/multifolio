"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-primary-foreground text-lg font-bold">M</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Multifolio</p>
          <p className="text-xs text-muted-foreground">Freelancer kariyer aracı</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        {status === "sent" ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">E-postanı kontrol et</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> adresine giriş
                bağlantısı gönderdik.
              </p>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Farklı e-posta ile dene
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-foreground">Giriş yap</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                E-postana sihirli bir giriş bağlantısı gönderilecek.
              </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">E-posta adresi</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sen@ornek.com"
                  className="h-10"
                />
              </div>
              {status === "error" && (
                <p className="text-sm text-destructive">{message}</p>
              )}
              <Button
                type="submit"
                disabled={status === "sending"}
                className="w-full h-10 font-medium"
              >
                {status === "sending" ? "Gönderiliyor…" : "Bağlantı gönder"}
              </Button>
            </form>
          </>
        )}
      </div>

      <Link href="/" className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" />
        Ana sayfaya dön
      </Link>
    </div>
  );
}
