// Kayıt sayfası: form mantığı signup-form.tsx'te — useSearchParams (?ref=
// davet kodu) App Router'da Suspense sınırı gerektirir.
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLayout><div className="min-h-[420px]" /></AuthLayout>}>
      <SignupForm />
    </Suspense>
  );
}
