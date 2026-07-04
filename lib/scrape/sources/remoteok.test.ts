import { describe, it, expect } from "vitest";
import { normalizeRemoteOK } from "./remoteok";

// RemoteOK API job objesi örneği (alanlar 2026-07-04'te gerçek yanıtla doğrulandı).
const sample = {
  id: "1134419",
  slug: "remote-technician-3-sunbelt-rentals-inc-1134419",
  position: "Technician 3",
  company: "Sunbelt Rentals, Inc.",
  location: "Freeport Ridge Estate, ",
  salary_min: 40000,
  salary_max: 60000,
  date: "2026-07-03T01:37:48+00:00",
  url: "https://remoteOK.com/remote-jobs/remote-technician-3-sunbelt-rentals-inc-1134419",
  tags: ["technical", "testing"],
  description: "<p>Fix <b>things</b> remotely</p>",
};

describe("normalizeRemoteOK", () => {
  it("ham RemoteOK objesini PoolJobUpsert'e çevirir + HTML'i düz metne indirger + maaşı formatlar", () => {
    expect(normalizeRemoteOK(sample)).toEqual({
      source: "remoteok",
      external_id: "1134419",
      title: "Technician 3",
      description: "Fix things remotely",
      url: "https://remoteOK.com/remote-jobs/remote-technician-3-sunbelt-rentals-inc-1134419",
      budget: "$40k-60k/yr",
      skills: ["technical", "testing"],
      client_country: "Freeport Ridge Estate",
      client_spent: null,
      posted_at: "2026-07-03T01:37:48+00:00",
    });
  });

  it("salary 0/eksik alanlarda null/[] verir (RemoteOK bilinmeyeni 0 gönderir)", () => {
    const r = normalizeRemoteOK({ id: 7, position: "X", salary_min: 0, salary_max: 0, location: " " });
    expect(r).toMatchObject({ external_id: "7", budget: null, skills: [], client_country: null, posted_at: null, url: null });
  });

  it("tek taraflı maaşı da formatlar", () => {
    expect(normalizeRemoteOK({ id: 8, position: "Y", salary_min: 0, salary_max: 90000 })?.budget).toBe("$90k/yr");
  });

  it("zorunlu alan (position) eksikse null döner (atlanır)", () => {
    expect(normalizeRemoteOK({ id: 1 })).toBeNull();
    expect(normalizeRemoteOK("garbage")).toBeNull();
  });

  it("dizinin ilk elemanı olan legal-notice objesini reddeder", () => {
    expect(normalizeRemoteOK({ last_updated: 1783122430, legal: "API Terms of Service: ..." })).toBeNull();
  });
});
