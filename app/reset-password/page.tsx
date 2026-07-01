"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  // Recovery oturumu var mı? (auth/confirm code'u çevirmiş olmalı)
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else router.replace("/forgot-password");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (password.length < 8) { setStatus("error"); setMessage("Şifre en az 8 karakter olmalı."); return; }
    if (password !== confirm) { setStatus("error"); setMessage("Şifreler eşleşmiyor."); return; }
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (!ready) {
    return <AuthLayout><p className="text-center text-sm text-muted-foreground">Yükleniyor…</p></AuthLayout>;
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">Yeni şifre belirle</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">Hesabın için yeni bir şifre gir.</p>
      </div>
      {status === "done" ? (
        <p className="text-center text-sm text-green-600 dark:text-green-400">Şifren güncellendi. Yönlendiriliyorsun…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">Yeni şifre</Label>
            <Input id="password" type="password" required autoFocus autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="En az 8 karakter" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-semibold text-foreground">Yeni şifre (tekrar)</Label>
            <Input id="confirm" type="password" required autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="h-11" />
          </div>
          {status === "error" && <p className="text-sm text-destructive">{message}</p>}
          <button type="submit" disabled={status === "submitting"}
            className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer bg-[#00F0FF] hover:bg-[#00d8e8] text-[#080A10] shadow-lg shadow-[#00F0FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {status === "submitting" ? "Güncelleniyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      )}
      <div className="mt-7 text-center">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Giriş&apos;e dön</Link>
      </div>
    </AuthLayout>
  );
}
