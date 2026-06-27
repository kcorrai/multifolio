import "server-only";
import OpenAI from "openai";
import { InternalError } from "@/lib/errors";

export const AI_MODEL = "gpt-4o-mini";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new InternalError("Uyarlama motoru yapılandırılmamış (OPENAI_API_KEY eksik).");
  }
  _client ??= new OpenAI({ apiKey });
  return _client;
}
