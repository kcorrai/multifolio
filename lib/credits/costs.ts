// Aksiyon başına sabit kredi maliyeti. Anahtarlar usage_events.kind ile birebir.
export const CREDIT_COSTS = {
  adaptation: 2,
  job_match: 2,
  proposal: 3,
  profile_suggest: 3,
  followup: 2,
  portfolio_generation: 5,
  cv_generation: 5,
  cv_tailor: 3,
  cv_bullets: 3,
  cv_summary: 2,
  interview_prep: 3,
  cover_letter: 3,
} as const;

export type CreditKind = keyof typeof CREDIT_COSTS;
