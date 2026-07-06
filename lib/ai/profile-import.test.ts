import { describe, it, expect, vi, beforeEach } from "vitest";

const parseMock = vi.fn();
vi.mock("./openai-client", () => ({
  AI_MODEL: "gpt-4o-mini",
  getOpenAIClient: () => ({ chat: { completions: { parse: parseMock } } }),
}));
// server-only guard'ı testte etkisizleştir
vi.mock("server-only", () => ({}));

import { extractProfile } from "./profile-import";

beforeEach(() => parseMock.mockReset());

function aiResponse(parsed: unknown) {
  return {
    choices: [{ message: { parsed }, finish_reason: "stop" }],
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  };
}

describe("extractProfile", () => {
  it("AI çıktısını taslak olarak döner ve maliyeti hesaplar", async () => {
    parseMock.mockResolvedValue(aiResponse({ headline: "Senior React Dev", summary: "10 yıl deneyim.", skills: ["React", "TypeScript"] }));
    const r = await extractProfile("profil metni");
    expect(r.draft.headline).toBe("Senior React Dev");
    expect(r.draft.skills).toEqual(["React", "TypeScript"]);
    expect(r.model).toBe("gpt-4o-mini");
    expect(r.inputTokens).toBe(100);
    expect(r.costUsd).toBeGreaterThan(0);
  });
  it("parsed null ise InternalError fırlatır", async () => {
    parseMock.mockResolvedValue({ choices: [{ message: { parsed: null }, finish_reason: "length" }], usage: {} });
    await expect(extractProfile("x")).rejects.toThrow();
  });
  it("uzun metni 20k'ya kırpıp gönderir", async () => {
    parseMock.mockResolvedValue(aiResponse({ headline: "", summary: "", skills: [] }));
    await extractProfile("x".repeat(30_000));
    const sent = parseMock.mock.calls[0][0].messages[1].content as string;
    expect(sent.length).toBeLessThan(21_000);
  });
});
