// Uygulamanın mutlak taban URL'i (iyzico callback + dönüş yönlendirmesi için).
// Prod'da NEXT_PUBLIC_APP_URL kesin sonuç verir; yoksa proxy header'larından türetilir.
export function appBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
