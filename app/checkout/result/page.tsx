import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout.result");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Ödeme dönüş sayfası. iyzico callback route'u buraya 303 ile yönlendirir
// (?status=success|failed). Kredi verimi CALLBACK'te olur — bu sayfa yalnız sonucu gösterir.
export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";
  const t = await getTranslations("checkout.result");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-10 text-center space-y-5">
        {success ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-red-500" aria-hidden />
        )}
        <h1 className="text-2xl font-extrabold tracking-tight">
          {success ? t("successTitle") : t("failedTitle")}
        </h1>
        <p className="text-slate-500 dark:text-[#94A3B8] font-medium">
          {success ? t("successBody") : t("failedBody")}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors"
          >
            {t("toDashboard")}
          </Link>
          {!success && (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
              {t("tryAgain")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
