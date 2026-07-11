// SAF admin allowlist yardımcıları (vitest'li). Admin kimliği: SAHİP e-postası koda
// gömülü (sıfır kurulum — /admin sahibine env ayarı olmadan açılır) + opsiyonel
// `ADMIN_EMAILS` env (virgülle ayrılmış EK admin'ler; yalnız sunucu, NEXT_PUBLIC değil
// → istemciye sızmaz). DB rol tablosu gerekmez.

// Uygulama sahibi (tek admin). Ek admin gerekiyorsa ADMIN_EMAILS env ile eklenir.
const OWNER_EMAILS = ["yanlizcakaan@gmail.com"];

export function parseAdminEmails(csv: string | undefined | null): string[] {
  return (csv ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(
  email: string | null | undefined,
  csv: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  if (!email) return false;
  const allow = new Set([...OWNER_EMAILS, ...parseAdminEmails(csv)]);
  return allow.has(email.trim().toLowerCase());
}
