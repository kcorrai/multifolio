"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-[#00F0FF]/10 border border-indigo-100 dark:border-[#00F0FF]/20">
            <Mail className="h-7 w-7 text-indigo-500 dark:text-[#00F0FF]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{t("forgot.checkTitle")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.rich("forgot.sentBody", {
                email,
                b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
              })}
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
            <ArrowLeft className="h-3 w-3" />{t("shared.backToLogin")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">{t("forgot.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("forgot.subtitle")}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t("shared.emailLabel")}</Label>
          <Input id="email" type="email" required autoFocus autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder={t("shared.emailPlaceholder")} className="h-11" />
        </div>
        {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <button type="submit" disabled={status === "submitting"}
          className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer bg-[#00F0FF] hover:bg-[#00d8e8] text-[#080A10] shadow-lg shadow-[#00F0FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
          {status === "submitting" ? t("forgot.submitting") : t("forgot.submit")}
        </button>
      </form>
      <div className="mt-7 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />{t("shared.backToLogin")}
        </Link>
      </div>
    </AuthLayout>
  );
}
