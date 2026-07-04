"use client";

// Kayıt formu — page.tsx'ten taşındı: useSearchParams (?ref= davet kodu) App
// Router'da Suspense sınırı ister, page bu bileşeni Suspense'le sarar.
// ?ref= kodu user_metadata.referred_by_code'a yazılır; ödül İLK profil
// kaydında sunucuda verilir (app/api/profile POST — DB lookup + idempotency).
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (password.length < 8) { setStatus("error"); setMessage(t("shared.passwordMin")); return; }
    if (password !== confirm) { setStatus("error"); setMessage(t("shared.passwordsMismatch")); return; }
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    // Davet kodu: format doğrulaması sunucuda (DB lookup); burada yalnız üst sınır.
    const ref = searchParams.get("ref")?.trim().slice(0, 32);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(ref ? { options: { data: { referred_by_code: ref } } } : {}),
    });
    if (error) {
      setStatus("error");
      setMessage(/registered|already/i.test(error.message) ? t("signup.errorRegistered") : error.message);
      return;
    }
    // "Confirm email" KAPALI → session hemen oluşur.
    if (!data.session) {
      setStatus("error");
      setMessage(t("signup.errorNoSession"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em]">{t("signup.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("signup.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t("shared.emailLabel")}</Label>
          <Input id="email" type="email" required autoFocus autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder={t("shared.emailPlaceholder")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t("shared.passwordLabel")}</Label>
          <Input id="password" type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder={t("shared.passwordMinPlaceholder")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-semibold text-foreground">{t("signup.confirmLabel")}</Label>
          <Input id="confirm" type="password" required autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="h-11" />
        </div>

        {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}

        <button type="submit" disabled={status === "submitting"}
          className="w-full h-11 rounded-lg font-semibold text-sm cursor-pointer flex items-center justify-center bg-[#00F0FF] hover:bg-[#00d8e8] active:bg-[#00c8d6] text-[#080A10] shadow-lg shadow-[#00F0FF]/20 hover:shadow-xl hover:shadow-[#00F0FF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 px-4">
          {status === "submitting" ? t("signup.submitting") : (<><span className="flex-1 text-center">{t("signup.submit")}</span><ArrowRight className="h-4 w-4 shrink-0" /></>)}
        </button>
      </form>

      <div className="mt-7 space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          {t("signup.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-foreground hover:underline underline-offset-2">{t("shared.signIn")}</Link>
        </p>
        <Link href="/" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />{t("shared.backHome")}
        </Link>
      </div>
    </AuthLayout>
  );
}
