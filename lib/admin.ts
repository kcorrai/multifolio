// SAF admin allowlist yardımcıları (vitest'li). Admin kimliği ENV tabanlı — `ADMIN_EMAILS`
// virgülle ayrılmış e-posta listesi (yalnız sunucu; NEXT_PUBLIC değil → istemciye sızmaz).
// DB şeması/rol tablosu gerekmez; tek satır env ile admin belirlenir. Boşsa admin YOK.

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
  return parseAdminEmails(csv).includes(email.trim().toLowerCase());
}
