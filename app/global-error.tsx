"use client";

// Kök ErrorBoundary: render sırasında yakalanmayan istemci hatalarını Sentry'ye
// gönderir ve kullanıcıya kurtarma (reset) seçeneği sunar. Next.js bu dosyayı
// kök layout'taki hatalar için otomatik kullanır; kendi <html>/<body>'sini içermeli.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Bir şeyler ters gitti</h1>
        <p className="text-sm text-neutral-500">
          Hata kaydedildi. Tekrar denemek isterseniz aşağıdaki düğmeyi kullanın.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
