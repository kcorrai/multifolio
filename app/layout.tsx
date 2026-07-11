import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  const locale = await getLocale();
  const description = t("metaDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description,
    applicationName: SITE_NAME,
    // og:title/description sayfa başlık+açıklamasından türetilir (Next); burada
    // yalnız ortak alanlar. OG görselleri opengraph-image.tsx ile (sonraki task).
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
