"use client";

// Solar Pop TEK MODLUDUR — design system'de koyu varyant yoktur (sıcak krem
// zemin, düz renk katmanları). Bu yüzden tema light'a SABİTLENİR: `forcedTheme`
// ile next-themes kök sınıfı hep "light" yapar, `dark:` varyantları ölü kalır ve
// eski ekranlar da Solar Pop token'larıyla ısınır.
// Provider korunur (kaldırılırsa useTheme çağıran bileşenler patlar); koyu tema
// geri istenirse tek yer burasıdır.
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
