// SAF hatırlatıcı/teslim-tarihi yardımcıları (AI/kredi/IO yok, test edilebilir).
// Tarihler saf gün (YYYY-MM-DD) — saat/timezone yok. Kart rozetleri + panel bunu kullanır.

export type ReminderUrgency = "overdue" | "today" | "soon" | "upcoming";

const DAY_MS = 86_400_000;

// YYYY-MM-DD'yi yerel gün-başı Date'ine çevirir (geçersizse null). Saat bileşeni
// yok → timezone kayması olmadan gün farkı hesaplanır.
function parseDay(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

// Hedef güne kalan tam gün sayısı (bugün=0, dün=-1, yarın=+1). Geçersizse null.
export function daysUntil(dateStr: string | null | undefined, now: Date): number | null {
  const target = parseDay(dateStr);
  if (!target) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

// Aciliyet sınıfı: geçmiş=overdue, bugün=today, 1-2 gün=soon, sonrası=upcoming.
export function reminderUrgency(dateStr: string | null | undefined, now: Date): ReminderUrgency | null {
  const days = daysUntil(dateStr, now);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  return "upcoming";
}
