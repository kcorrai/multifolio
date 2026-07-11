"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  // Recovery oturumu var mı? (auth/confirm code'u çevirmiş olmalı). Async getSession
  // unmount sonrası çözülürse setState/replace çağırmayı önle (mounted guard).
  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setReady(true);
      else router.replace("/forgot-password");
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (password.length < 8) { setStatus("error"); setMessage(t("shared.passwordMin")); return; }
    if (password !== confirm) { setStatus("error"); setMessage(t("shared.passwordsMismatch")); return; }
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (!ready) {
    return <AuthLayout><p className="text-center text-sm text-muted-foreground">{t("reset.loading")}</p></AuthLayout>;
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">{t("reset.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("reset.subtitle")}</p>
      </div>
      {status === "done" ? (
        <p className="text-center text-sm text-green-600 dark:text-green-400">{t("reset.done")}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t("reset.newPasswordLabel")}</Label>
            <Input id="password" type="password" required autoFocus autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder={t("shared.passwordMinPlaceholder")} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-semibold text-foreground">{t("reset.confirmLabel")}</Label>
            <Input id="confirm" type="password" required autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="h-11" />
          </div>
          {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <button type="submit" disabled={status === "submitting"}
            className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer bg-[#00F0FF] hover:bg-[#00d8e8] text-[#080A10] shadow-lg shadow-[#00F0FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {status === "submitting" ? t("reset.submitting") : t("reset.submit")}
          </button>
        </form>
      )}
      <div className="mt-7 text-center">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("shared.backToLogin")}</Link>
      </div>
    </AuthLayout>
  );
}
