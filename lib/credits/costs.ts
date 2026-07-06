// Aksiyon başına sabit kredi maliyeti. Anahtarlar usage_events.kind ile birebir.
export const CREDIT_COSTS = {
  adaptation: 1,
  job_match: 1,
  proposal: 2,
  profile_suggest: 2,
  followup: 1,
  portfolio_generation: 3,
  cv_generation: 3,
  cv_tailor: 2,
} as const;

export type CreditKind = keyof typeof CREDIT_COSTS;
