"use client";

// Minimal magic-link (e-posta OTP) girişi. Şifre yok; Supabase bir giriş bağlantısı
// e-postalar, bağlantı /auth/confirm'e döner. (Canlı e-posta için gerçek Supabase
// SMTP yapılandırması gerekir.)
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center p-8">
      <Card>
        <CardHeader>
          <CardTitle>Giriş</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <p className="text-sm text-neutral-500">
              <strong>{email}</strong> adresine bir giriş bağlantısı gönderdik. E-postanı kontrol et.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sen@ornek.com"
                />
              </div>
              {status === "error" && <p className="text-sm text-red-600">{message}</p>}
              <Button type="submit" disabled={status === "sending"} className="w-full">
                {status === "sending" ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
