"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setStatus("error"); setMessage(t("login.errorInvalid")); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t("shared.emailLabel")}</Label>
          <Input id="email" type="email" required autoFocus autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder={t("shared.emailPlaceholder")} className="h-11" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t("shared.passwordLabel")}</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              {t("login.forgotPassword")}
            </Link>
          </div>
          <Input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11" />
        </div>

        {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}

        <button type="submit" disabled={status === "submitting"}
          className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer flex items-center justify-center bg-[#00F0FF] hover:bg-[#00d8e8] active:bg-[#00c8d6] text-[#080A10] shadow-lg shadow-[#00F0FF]/20 hover:shadow-xl hover:shadow-[#00F0FF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 px-4">
          {status === "submitting" ? t("login.submitting") : (<><span className="flex-1 text-center">{t("login.submit")}</span><ArrowRight className="h-4 w-4 shrink-0" /></>)}
        </button>
      </form>

      <div className="mt-7 space-y-3 text-center anim-fade-in anim-d2">
        <p className="text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-foreground hover:underline underline-offset-2">{t("shared.signUp")}</Link>
        </p>
        <p className="text-sm text-muted-foreground">
          {t("login.magicLinkPrompt")}{" "}
          <Link href="/forgot-password" className="text-muted-foreground hover:underline underline-offset-2">{t("login.setPassword")}</Link>
        </p>
        <Link href="/" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />{t("shared.backHome")}
        </Link>
      </div>
    </AuthLayout>
  );
}
