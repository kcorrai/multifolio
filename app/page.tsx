import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Faz 0 açılış sayfası — sade bir durum göstergesi. Asıl ürün akışı Faz 1+'da gelir.
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Multifolio</h1>
        <p className="mt-2 text-neutral-500">
          Çoklu platform freelancer kariyer aracı. Profilini bir kez gir; her platform için
          optimize et.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faz 0 — Zemin kuruldu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-500">
          <ul className="list-inside list-disc space-y-1">
            <li>Hata görünürlüğü: Sentry + tipli AppError + withErrorHandler</li>
            <li>Güvenli-by-default: Zod doğrulama + Supabase RLS + HTML sanitize</li>
            <li>Dokümantasyon: CLAUDE.md + docs/</li>
          </ul>
          <p className="mt-4">
            Detay için <code className="font-mono">docs/</code> klasörüne bak.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
