"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Kredi paketi satın alma butonu. /api/checkout'a POST atar, dönen iyzico hosted
// ödeme sayfasına yönlendirir. Fiyat/kredi SUNUCUDA çözülür — burada yalnız paket kimliği.
export function BuyCreditsButton({
  packageId,
  label,
  className,
}: {
  packageId: "starter" | "pro" | "scale";
  label: string;
  className?: string;
}) {
  const t = useTranslations("checkout");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = (await res.json()) as { paymentPageUrl?: string; error?: { message?: string } };
      if (!res.ok || !data.paymentPageUrl) {
        setError(data.error?.message || t("error"));
        setLoading(false);
        return;
      }
      // iyzico hosted ödeme sayfasına git (aynı sekme).
      window.location.href = data.paymentPageUrl;
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <button type="button" onClick={buy} disabled={loading} className={className} aria-busy={loading}>
        {loading ? t("processing") : label}
      </button>
      {error && (
        <p className="text-center text-xs font-medium text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
