// SAF sahte-mülakat oturum raporu (AI/kredi YOK — deterministik). Yanıtlanan soruların
// skorlarından genel skor + tekrarlanan gelişim temalarını çıkarır. Oturum bitişinde
// (/api/interview/mock/complete) ve geçmiş oturum görüntülemede kullanılır.
import type { InterviewQuestionRecord } from "@/lib/validation/schemas/mock-interview";

export interface SessionReport {
  answeredCount: number;
  totalCount: number;
  overallScore: number | null; // yanıtlanan yoksa null
  topStrengths: string[]; // en sık geçen güçlü yönler
  topImprovements: string[]; // en sık geçen gelişim alanları
}

// Yanıtlanmış (score != null) soruları süz.
function answered(questions: InterviewQuestionRecord[]): InterviewQuestionRecord[] {
  return questions.filter((q) => q.score !== null && q.answer !== null);
}

// Genel skor: yanıtlanan skorların yuvarlanmış ortalaması (yanıt yoksa null).
export function overallScore(questions: InterviewQuestionRecord[]): number | null {
  const done = answered(questions);
  if (done.length === 0) return null;
  const sum = done.reduce((acc, q) => acc + (q.score ?? 0), 0);
  return Math.round(sum / done.length);
}

// Metin listesini normalize edip (küçük harf, boşluk sadeleştir) sıklığa göre en çok
// tekrar edenleri döndürür — orijinal (ilk görülen) yazımı korur. Tekilleştirme + tema.
function topThemes(items: string[], limit: number): string[] {
  const counts = new Map<string, { count: number; original: string }>();
  for (const raw of items) {
    const text = raw.trim();
    if (!text) continue;
    const key = text.toLowerCase().replace(/\s+/g, " ");
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { count: 1, original: text });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e) => e.original);
}

export function buildSessionReport(questions: InterviewQuestionRecord[], limit = 4): SessionReport {
  const done = answered(questions);
  return {
    answeredCount: done.length,
    totalCount: questions.length,
    overallScore: overallScore(questions),
    topStrengths: topThemes(done.flatMap((q) => q.strengths), limit),
    topImprovements: topThemes(done.flatMap((q) => q.improvements), limit),
  };
}
