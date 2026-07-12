// Kayıt sayfası: form mantığı signup-form.tsx'te — useSearchParams (?ref=
// davet kodu) App Router'da Suspense sınırı gerektirir.
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getUserMarket } from "@/lib/markets/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  // KVKK onayı yalnız TR pazarında; global'de terms + privacy yeterli.
  const { hasKvkk } = await getUserMarket();
  return (
    <Suspense fallback={<AuthLayout><div className="min-h-[420px]" /></AuthLayout>}>
      <SignupForm hasKvkk={hasKvkk} />
    </Suspense>
  );
}
