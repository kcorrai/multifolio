"use client";

// Şifre sıfırlama isteği — Solar Pop. AKIŞ DEĞİŞMEDİ: resetPasswordForEmail →
// /auth/confirm?next=/reset-password.
//
// DÜRÜSTLÜK (tasarım kararı): enumeration koruması yüzünden hesap OLMASA da bu
// ekran görünür ve mail gitmez. Bu yüzden kopya "gönderdik" demez — ne yapıldığını,
// neye bakılacağını söyler ve üç çıkış sunar: tekrar gönder, başka adres, girişe dön.
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import {
  AuthLayout, AuthHead, AuthSubmit, AuthBanner, AuthIcon,
} from "@/components/auth/auth-layout";
import { TextField } from "@/components/solar/fields";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const ts = useTranslations("auth.sp");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const busy = status === "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("sent");
  }

  const helper = { text: ts("helper.remembered"), label: ts("helper.logIn"), href: "/login" };

  if (status === "sent") {
    return (
      <AuthLayout stub="none" aside={null} helper={helper}>
        <AuthIcon icon={Mail} />
        <AuthHead title={ts("forgot.sentTitle")} script={ts("forgot.sentScript")} sub={ts("forgot.sentBody", { email })} />

        <div className="grid gap-[9px] rounded-[var(--radius-sp-md)] p-4" style={{ background: "var(--surface-page)" }}>
          {(["spam", "expiry"] as const).map((k) => (
            <span
              key={k}
              className="grid gap-2.5"
              style={{ gridTemplateColumns: "18px 1fr", font: "var(--fw-regular) var(--fs-body-s)/1.55 var(--font-body)", color: "var(--text-body)" }}
            >
              <span className="mt-1.5 h-[7px] w-[7px] rounded-[var(--radius-pill)]" style={{ background: "var(--pink-400)" }} />
              {ts(`forgot.tips.${k}`)}
            </span>
          ))}
        </div>

        <div className="grid gap-3">
          <button type="button" className="sp-btn sp-btn--block sp-btn--ghost" onClick={() => setStatus("idle")}>
            {ts("forgot.tryAnother")}
          </button>
          <Link href="/login" className="sp-linkish justify-self-center">{t("shared.backToLogin")}</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout stub="none" aside={null} helper={helper}>
      {status === "error" ? <AuthBanner tone="danger" title={ts("forgot.errorTitle")} body={message} /> : null}

      <AuthHead title={ts("forgot.title")} script={ts("forgot.script")} sub={ts("forgot.sub")} />

      <form onSubmit={onSubmit} className="grid gap-[17px]">
        <TextField
          id="email"
          label={t("shared.emailLabel")}
          type="email"
          autoComplete="email"
          required
          autoFocus
          disabled={busy}
          leading={<Mail size={16} />}
          placeholder={t("shared.emailPlaceholder")}
          value={email}
          onChange={setEmail}
        />
        <AuthSubmit label={t("forgot.submit")} busyLabel={t("forgot.submitting")} busy={busy} />
      </form>
    </AuthLayout>
  );
}
