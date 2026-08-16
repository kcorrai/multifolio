"use client";

// Yeni şifre belirleme — Solar Pop. AKIŞ DEĞİŞMEDİ: /auth/confirm recovery
// kodunu çevirmiş olmalı; oturum varsa updateUser({password}) → /dashboard.
//
// Tasarım kararı: token geçerliliği form BOYANMADAN önce çözülür (kimse
// gönderilemeyecek bir forma yazmasın) ve süresi dolmuş durum kartın TAMAMINI
// değiştirir — eskiden sessizce /forgot-password'a atıyorduk, kullanıcı ne
// olduğunu anlamıyordu.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, X, Check } from "lucide-react";
import {
  AuthLayout, AuthHead, AuthSubmit, AuthBanner, AuthIcon, PasswordStrength, RevealButton,
} from "@/components/auth/auth-layout";
import { TextField } from "@/components/solar/fields";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Token = "checking" | "valid" | "expired";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const ts = useTranslations("auth.sp");
  const router = useRouter();

  const [token, setToken] = useState<Token>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setToken(data.session ? "valid" : "expired");
    });
    return () => { mounted = false; };
  }, []);

  const busy = status === "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = t("shared.passwordMin");
    if (password !== confirm) next.confirm = t("shared.passwordsMismatch");
    setErrors(next);
    if (Object.keys(next).length > 0) { setStatus("error"); return; }

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (token === "checking") {
    return (
      <AuthLayout stub="none" aside={null}>
        <div className="flex items-center gap-4">
          <span
            className="sp-spin h-[26px] w-[26px] rounded-[var(--radius-pill)]"
            style={{ border: "3px solid var(--cream-400)", borderTopColor: "var(--flame-500)" }}
          />
          <span className="sp-body">{t("reset.loading")}</span>
        </div>
      </AuthLayout>
    );
  }

  if (token === "expired") {
    return (
      <AuthLayout stub="none" aside={null}>
        <AuthIcon icon={X} />
        <AuthHead title={ts("reset.expiredTitle")} script={ts("reset.expiredScript")} sub={ts("reset.expiredBody")} />
        <div className="grid gap-3">
          <Link href="/forgot-password" className="sp-btn sp-btn--lg sp-btn--block">{ts("reset.expiredCta")}</Link>
          <Link href="/login" className="sp-linkish justify-self-center">{t("shared.backToLogin")}</Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === "done") {
    return (
      <AuthLayout stub="none" aside={null}>
        <AuthIcon icon={Check} />
        <AuthHead title={ts("reset.doneTitle")} script={ts("reset.doneScript")} sub={ts("reset.doneBody")} />
        <Link href="/dashboard" className="sp-btn sp-btn--lg sp-btn--block">{ts("reset.doneCta")}</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout stub="none" aside={null}>
      {status === "error" && message ? <AuthBanner tone="danger" title={ts("reset.failedTitle")} body={message} /> : null}

      <AuthHead title={ts("reset.title")} script={ts("reset.script")} sub={ts("reset.sub")} />

      <form onSubmit={onSubmit} className="grid gap-[17px]">
        <div className="grid gap-[9px]">
          <TextField
            id="password"
            label={t("reset.newPasswordLabel")}
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
            autoFocus
            disabled={busy}
            leading={<Lock size={16} />}
            placeholder={t("shared.passwordMinPlaceholder")}
            value={password}
            onChange={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password ?? null}
            trailing={
              <RevealButton
                on={reveal}
                onToggle={() => setReveal((r) => !r)}
                labelShow={ts("showPassword")}
                labelHide={ts("hidePassword")}
              />
            }
          />
          {errors.password ? null : <PasswordStrength length={password.length} />}
        </div>

        <TextField
          id="confirm"
          label={t("reset.confirmLabel")}
          type="password"
          autoComplete="new-password"
          required
          disabled={busy}
          leading={<Lock size={16} />}
          value={confirm}
          onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
          error={errors.confirm ?? null}
        />

        <AuthSubmit label={t("reset.submit")} busyLabel={t("reset.submitting")} busy={busy} />
      </form>
    </AuthLayout>
  );
}
