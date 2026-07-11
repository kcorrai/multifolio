// SAF admin allowlist yardımcıları (vitest'li). Admin kimliği ENV tabanlı — `ADMIN_EMAILS`
// virgülle ayrılmış e-posta listesi (yalnız sunucu; NEXT_PUBLIC değil → istemciye sızmaz).
// DB rol tablosu gerekmez; kod da e-posta tutmaz. Boşsa admin YOK (panel kimseye açılmaz).

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
