// Model fiyatlandırması ve maliyet hesabı. Fiyatlar USD / 1M token.
const MARGIN = 1.0;

const MODEL_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o":      { input: 2.50, output: 10.00 },
};

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

export function computeCostUsd(model: string, usage: TokenUsage): number {
  const rates = MODEL_RATES[model];
  if (!rates) return 0;
  return (
    ((usage.prompt_tokens * rates.input + usage.completion_tokens * rates.output) / 1_000_000) *
    MARGIN
  );
}
