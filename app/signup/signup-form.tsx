"use client";

// Kayıt formu — Solar Pop "bilet" kompozisyonu. AKIŞ DEĞİŞMEDİ:
// ?ref= davet kodu user_metadata.referred_by_code'a yazılır (ödül İLK profil
// kaydında sunucuda verilir), onay kutusu terms_accepted olarak audit izine gider,
// "Confirm email" kapalı olduğu için oturum hemen açılır → /dashboard.
//
// Tasarım kararı: doğrulama ALAN BAZINDA gösterilir (tek genel satır değil),
// kredi vaadi gönder butonunun hemen üstünde durur, ?ref= ile gelen ziyaretçi
// davet edildiğini GÖRÜR (şerit pembe davet bandına döner).
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Lock } from "lucide-react";
import {
  AuthLayout, AuthHead, AuthSubmit, AuthBanner, AuthPromise, AltRoute,
  PasswordStrength, RevealButton,
} from "@/components/auth/auth-layout";
import { TextField } from "@/components/solar/fields";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FieldErrors = { password?: string; confirm?: string; consent?: string };

export function SignupForm() {
  const t = useTranslations("auth");
  const ts = useTranslations("auth.sp");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "taken" | "error">("idle");
  const [message, setMessage] = useState("");

  const ref = searchParams.get("ref")?.trim().slice(0, 32);
  const busy = status === "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    // Alan bazlı doğrulama — hepsi tek seferde, ilgili alanın altında.
    const next: FieldErrors = {};
    if (password.length < 8) next.password = t("shared.passwordMin");
    if (password !== confirm) next.confirm = t("shared.passwordsMismatch");
    if (!agreed) next.consent = t("signup.consentRequired");
    setErrors(next);
    if (Object.keys(next).length > 0) { setStatus("error"); return; }

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const metadata: Record<string, unknown> = { terms_accepted: true };
    if (ref) metadata.referred_by_code = ref;

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (error) {
      if (/registered|already/i.test(error.message)) { setStatus("taken"); return; }
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (!data.session) {
      setStatus("error");
      setMessage(t("signup.errorNoSession"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      stub={ref ? "referral" : "benefits"}
      aside="signup"
      helper={{ text: ts("helper.hasAccount"), label: ts("helper.logIn"), href: "/login" }}
      altRoute={
        <AltRoute>
          <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1 var(--font-body)", color: "var(--text-body)" }}>
            {t("signup.hasAccount")}
          </span>
          <Link href="/login" className="sp-linkish">{ts("helper.logIn")}</Link>
        </AltRoute>
      }
    >
      {status === "taken" ? (
        <AuthBanner
          tone="danger"
          title={ts("signup.takenTitle")}
          body={ts("signup.takenBody")}
          action={ts("signup.takenAction")}
          actionHref="/login"
        />
      ) : null}
      {status === "error" && message ? (
        <AuthBanner tone="danger" title={ts("signup.failedTitle")} body={message} />
      ) : null}

      <AuthHead title={ts("signup.title")} script={ts("signup.script")} sub={ts("signup.sub")} />

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

        <div className="grid gap-[9px]">
          <TextField
            id="password"
            label={t("shared.passwordLabel")}
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
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
          label={t("signup.confirmLabel")}
          type="password"
          autoComplete="new-password"
          required
          disabled={busy}
          leading={<Lock size={16} />}
          value={confirm}
          onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
          error={errors.confirm ?? null}
        />

        <label
          htmlFor="consent"
          className="grid cursor-pointer items-start gap-[13px] rounded-[var(--radius-sp-md)] px-4 py-3.5"
          style={{
            gridTemplateColumns: "22px 1fr",
            background: errors.consent ? "rgba(240,86,140,.08)" : "var(--surface-page)",
            boxShadow: errors.consent ? "inset 0 0 0 1.5px var(--pink-600)" : "none",
          }}
        >
          <input
            id="consent"
            type="checkbox"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); setErrors((x) => ({ ...x, consent: undefined })); }}
            aria-describedby={errors.consent ? "consent-err" : undefined}
            className="mt-px h-[19px] w-[19px]"
            style={{ accentColor: "var(--flame-500)" }}
          />
          <span className="grid gap-[5px]">
            <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1.6 var(--font-body)", color: "var(--text-body)" }}>
              {t.rich("signup.consentGlobal", {
                terms: (chunks) => <Link href="/terms" target="_blank" rel="noopener">{chunks}</Link>,
                privacy: (chunks) => <Link href="/privacy" target="_blank" rel="noopener">{chunks}</Link>,
              })}
            </span>
            {errors.consent ? (
              <span
                id="consent-err"
                role="alert"
                style={{ font: "var(--fw-medium) var(--fs-body-s)/1.4 var(--font-body)", color: "var(--pink-600)" }}
              >
                {ts("signup.consentError")}
              </span>
            ) : null}
          </span>
        </label>

        <div className="grid gap-[13px]">
          <AuthPromise text={ref ? ts("signup.promiseReferral") : ts("signup.promise")} />
          <AuthSubmit label={t("signup.submit")} busyLabel={ts("signup.submitting")} busy={busy} />
        </div>
      </form>
    </AuthLayout>
  );
}
