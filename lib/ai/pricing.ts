// Model fiyatlandırması ve maliyet hesabı. Kullanıcının "ne kadar para harcadığı"
// buradan, gerçek token kullanımına göre hesaplanır (soyut kredi değil).
// Fiyatlar USD / 1M token. Müşteriye yansıtılan fiyat = ham maliyet × MARGIN.
import type Anthropic from "@anthropic-ai/sdk";

interface ModelRates {
  input: number; // $/1M giriş token
  output: number; // $/1M çıkış token
  cacheRead: number; // $/1M cache-read token (≈0.1× input)
  cacheWrite: number; // $/1M cache-write token (≈1.25× input)
}

// Kaynak: Claude model fiyatları (Opus 4.8: $5 giriş / $25 çıkış per 1M).
const MODEL_RATES: Record<string, ModelRates> = {
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
};

// Müşteriye yansıtılan kâr marjı çarpanı. Faz 4'te (ödeme) ayarlanır; şimdilik 1.0.
const MARGIN = 1.0;

/** Bir Claude yanıtının usage'ından USD maliyeti hesaplar. */
export function computeCostUsd(model: string, usage: Anthropic.Usage): number {
  const rates = MODEL_RATES[model];
  if (!rates) return 0; // bilinmeyen model → 0 (loglanır, faturalanmaz)

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;

  const raw =
    (inputTokens * rates.input +
      outputTokens * rates.output +
      cacheRead * rates.cacheRead +
      cacheWrite * rates.cacheWrite) /
    1_000_000;

  return raw * MARGIN;
}
