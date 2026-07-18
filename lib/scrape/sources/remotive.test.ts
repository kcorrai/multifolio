import { describe, it, expect } from "vitest";
import { normalizeRemotive } from "./remotive";

// Remotive API job objesi örneği (alanlar remotive.com/api/remote-jobs'tan).
const sample = {
  id: 12345,
  title: "Senior React Developer",
  company_name: "Acme",
  url: "https://remotive.com/remote-jobs/software-dev/senior-react-12345",
  tags: ["React", "TypeScript"],
  salary: "$80k - $100k",
  candidate_required_location: "Worldwide",
  publication_date: "2026-06-30T10:00:00",
  description: "<p>Build <b>great</b> UIs</p>",
  job_type: "contract",
};

describe("normalizeRemotive", () => {
  it("ham Remotive objesini PoolJobUpsert'e çevirir + HTML'i düz metne indirger", () => {
    expect(normalizeRemotive(sample)).toEqual({
      source: "remotive",
      external_id: "12345",
      title: "Senior React Developer",
      description: "Build great UIs",
      url: "https://remotive.com/remote-jobs/software-dev/senior-react-12345",
      budget: "$80k - $100k",
      skills: ["React", "TypeScript"],
      client_country: "Worldwide",
      client_spent: null,
      posted_at: "2026-06-30T10:00:00",
      job_type: "contract",
    });
  });

  it("eksik salary/tags/location'da null/[] verir + job_type yoksa null", () => {
    const r = normalizeRemotive({ id: 7, title: "X", description: "" });
    expect(r).toMatchObject({ external_id: "7", budget: null, skills: [], client_country: null, posted_at: null, url: null, job_type: null });
  });

  it("zorunlu alan (title) eksikse null döner (atlanır)", () => {
    expect(normalizeRemotive({ id: 1 })).toBeNull();
    expect(normalizeRemotive("garbage")).toBeNull();
  });
});
