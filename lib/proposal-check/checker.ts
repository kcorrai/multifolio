// Teklif / kapak-mektubu denetçisi (SAF, AI/API/kredi yok): kazanan-teklif
// kriterlerine göre deterministik puan. Tamamen istemcide çalışır. EN+TR desen
// tanıma (müşteri/klişe kelimeler iki dilde). SEO aracı — /earnings deseni.

export type CheckId = "length" | "question" | "numbers" | "clientFocus" | "noFiller";

export interface ProposalCheckItem {
  id: CheckId;
  passed: boolean;
  weight: number;
}

export interface ProposalReport {
  wordCount: number;
  checks: ProposalCheckItem[];
  /** Bulunan klişe/dolgu ifadeler (gösterim için). */
  fillerFound: string[];
  /** 0-100 ağırlıklı skor. */
  score: number;
  verdict: "strong" | "ok" | "weak";
}

const WEIGHTS: Record<CheckId, number> = {
  length: 25,
  question: 15,
  numbers: 20,
  clientFocus: 20,
  noFiller: 20,
};

// Müşteri-odaklı zamirler (EN+TR) — teklif müşteriye dönük olmalı, "ben"e değil.
const CLIENT_RE = /\b(you|your|yours|you're|siz|sizin|size|sizi|senin|sana|seni)\b/gi;
const SELF_RE = /\b(i|i'm|my|me|mine|ben|benim|bana|beni|benimki)\b/gi;

// Klişe / dolgu ifadeler (EN+TR) — bulunması puanı düşürür.
const FILLER_PHRASES = [
  "dear sir", "dear madam", "to whom it may concern", "i am writing",
  "i hope this message finds you", "i hope this finds you", "please find attached",
  "i am the best", "hard-working", "hard working", "self-motivated", "team player",
  "i am confident that i", "i have attached", "years of experience",
  "sayın yetkili", "umarım iyisinizdir", "işinizde en iyisi", "çalışkan biriyim",
  "ekip oyuncusu", "kendini motive eden", "özgeçmişimi ekledim", "en iyisiyim",
];

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

export function checkProposal(input: string): ProposalReport {
  const text = (input || "").trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lower = text.toLowerCase();

  const fillerFound = FILLER_PHRASES.filter((p) => lower.includes(p));

  const clientCount = countMatches(text, CLIENT_RE);
  const selfCount = countMatches(text, SELF_RE);

  // Anlamlı metin yoksa hepsini başarısız say (skor 0).
  const hasText = wordCount >= 5;

  const checks: ProposalCheckItem[] = [
    { id: "length", passed: hasText && wordCount >= 30 && wordCount <= 250, weight: WEIGHTS.length },
    { id: "question", passed: hasText && text.includes("?"), weight: WEIGHTS.question },
    { id: "numbers", passed: hasText && /\d/.test(text), weight: WEIGHTS.numbers },
    // Müşteri odaklılık: müşteri zamirleri en az kişisel zamirler kadar (ve en az 1).
    { id: "clientFocus", passed: hasText && clientCount >= 1 && clientCount >= selfCount, weight: WEIGHTS.clientFocus },
    { id: "noFiller", passed: hasText && fillerFound.length === 0, weight: WEIGHTS.noFiller },
  ];

  const score = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  const verdict: ProposalReport["verdict"] = score >= 80 ? "strong" : score >= 50 ? "ok" : "weak";

  return { wordCount, checks, fillerFound, score, verdict };
}
