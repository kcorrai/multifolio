// ⚠️ Sunucu-only Anthropic Claude istemcisi. ANTHROPIC_API_KEY yalnızca sunucuda;
// asla istemciye import edilmez (server-only ile korunur). Uyarlama motorunun
// (lib/ai/adapt.ts) tek giriş noktası.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { InternalError } from "@/lib/errors";

// Uyarlama motoru modeli. En yetenekli Claude modeli (bkz. CLAUDE sert kuralları).
export const ADAPTATION_MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Yapılandırma eksikse net bir sunucu hatası; withErrorHandler bunu
    // Sentry'ye gönderir ve istemciye generic 500 döner.
    throw new InternalError("Uyarlama motoru yapılandırılmamış (ANTHROPIC_API_KEY eksik).");
  }
  client ??= new Anthropic({ apiKey });
  return client;
}
