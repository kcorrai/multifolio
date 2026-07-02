import { describe, it, expect } from "vitest";
import { normalizeArbeitnow } from "./arbeitnow";

const sample = {
  slug: "backend-engineer-acme-123",
  title: "Backend Engineer",
  description: "<p>Go &amp; Postgres</p>",
  url: "https://www.arbeitnow.com/jobs/backend-engineer-acme-123",
  tags: ["Go", "Postgres"],
  location: "Berlin",
  created_at: 1751328000, // unix saniye
};

describe("normalizeArbeitnow", () => {
  it("ham Arbeitnow objesini PoolJobUpsert'e çevirir (created_at unix→ISO)", () => {
    const r = normalizeArbeitnow(sample);
    expect(r).toMatchObject({
      source: "arbeitnow",
      external_id: "backend-engineer-acme-123",
      title: "Backend Engineer",
      description: "Go & Postgres",
      url: "https://www.arbeitnow.com/jobs/backend-engineer-acme-123",
      budget: null,
      skills: ["Go", "Postgres"],
      client_country: "Berlin",
      client_spent: null,
    });
    expect(r?.posted_at).toBe(new Date(1751328000 * 1000).toISOString());
  });

  it("created_at yoksa posted_at null", () => {
    const r = normalizeArbeitnow({ slug: "x", title: "X", description: "" });
    expect(r).toMatchObject({ external_id: "x", posted_at: null, skills: [], client_country: null });
  });

  it("zorunlu alan (slug) eksikse null döner", () => {
    expect(normalizeArbeitnow({ title: "no slug" })).toBeNull();
    expect(normalizeArbeitnow(42)).toBeNull();
  });
});
