"use client";

// Giriş — Solar Pop "bilet" kompozisyonu. AKIŞ DEĞİŞMEDİ:
// signInWithPassword → /dashboard. Yenilikler sunum tarafında: ince "welcome"
// şeridi (mevcut kullanıcıya kredi tanıtımı gereksiz), şifre görünürlüğü
// (buradaki en sık hata yazım hatası) ve çıkmaz sokak olmayan hata bandı.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Lock } from "lucide-react";
import {
  AuthLayout, AuthHead, AuthSubmit, AuthBanner, AltRoute, RevealButton,
} from "@/components/auth/auth-layout";
import { TextField } from "@/components/solar/fields";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const t = useTranslations("auth");
  const ts = useTranslations("auth.sp");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const busy = status === "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setStatus("error"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      stub="welcome"
      aside="login"
      helper={{ text: ts("helper.noAccount"), label: ts("helper.signUp"), href: "/signup" }}
      altRoute={
        <AltRoute>
          <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1 var(--font-body)", color: "var(--text-body)" }}>
            {t("login.noAccount")}
          </span>
          <Link href="/signup" className="sp-linkish">{ts("helper.signUpLong")}</Link>
        </AltRoute>
      }
    >
      {status === "error" ? (
        <AuthBanner
          tone="danger"
          title={ts("login.errorTitle")}
          body={ts("login.errorBody")}
          action={ts("login.errorAction")}
          actionHref="/forgot-password"
        />
      ) : null}

      <AuthHead title={ts("login.title")} script={ts("login.script")} />

      <form onSubmit={onSubmit} className="grid gap-[17px]">
        <TextField
          id="email"
          label={t("shared.emailLabel")}
          type="email"
          autoComplete="username"
          required
          autoFocus
          disabled={busy}
          leading={<Mail size={16} />}
          placeholder={t("shared.emailPlaceholder")}
          value={email}
          onChange={setEmail}
        />
        <TextField
          id="password"
          label={t("shared.passwordLabel")}
          type={reveal ? "text" : "password"}
          autoComplete="current-password"
          required
          disabled={busy}
          leading={<Lock size={16} />}
          value={password}
          onChange={setPassword}
          error={status === "error" ? ts("login.fieldError") : null}
          aside={<Link href="/forgot-password" className="sp-linkish">{ts("login.forgot")}</Link>}
          trailing={
            <RevealButton
              on={reveal}
              onToggle={() => setReveal((r) => !r)}
              labelShow={ts("showPassword")}
              labelHide={ts("hidePassword")}
            />
          }
        />
        <AuthSubmit label={t("login.submit")} busyLabel={ts("login.submitting")} busy={busy} />
      </form>
    </AuthLayout>
  );
}
