"use client";

import { useEffect, useState } from "react";
import { MailCheck, ShieldCheck, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function VerifyEmailBanner({ emailVerified, email }: { emailVerified: boolean; email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const verified = p.get("verified") === "1";
    const verifyError = p.get("verify_error") === "1";

    if (!verified && !verifyError) return;

    const msg = verified ? "E-postan doğrulandı ✓" : "Doğrulama başarısız, tekrar dene.";
    // URL'i temizle (toast paramlarını kaldır)
    window.history.replaceState(null, "", window.location.pathname);

    const t1 = setTimeout(() => setToast(msg), 0);
    const t2 = setTimeout(() => setToast(""), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  async function sendVerification() {
    setState("sending");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/verify-email` },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <>
      {!emailVerified && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">E-postanı doğrula</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
              {state === "sent"
                ? `${email} adresine doğrulama bağlantısı gönderildi. Gelen kutunu kontrol et.`
                : "Hesabını güvence altına almak için e-posta adresini doğrula."}
            </p>
          </div>
          {state !== "sent" && (
            <button onClick={sendVerification} disabled={state === "sending"}
              className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 transition-colors cursor-pointer">
              {state === "sending" ? "Gönderiliyor…" : "Doğrulama e-postası gönder"}
            </button>
          )}
          {state === "error" && <p className="text-xs text-destructive w-full">Gönderilemedi, tekrar dene.</p>}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-white dark:bg-slate-900 dark:border-green-800/60 px-4 py-3 shadow-lg shadow-green-500/10">
          <div className="h-7 w-7 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
            <MailCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-semibold text-foreground">{toast}</p>
          <button onClick={() => setToast("")} className="text-muted-foreground/60 hover:text-foreground cursor-pointer"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </>
  );
}
