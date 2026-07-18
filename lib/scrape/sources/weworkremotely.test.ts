import { describe, it, expect } from "vitest";
import { parseWwrItems, normalizeWeWorkRemotely } from "./weworkremotely";

// Gerçek WWR RSS gövdesinden kırpılmış örnek (HTML-escaped description).
const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>We Work Remotely</title>
  <item>
    <media:content url="https://logo.example/x.gif" type="image/png"/>
    <title>Highlevel: Product Solutions Engineer</title>
    <region>Anywhere in the World</region>
    <category>Full-Stack Programming</category>
    <description>&lt;p&gt;Build &lt;b&gt;great&lt;/b&gt; things&lt;/p&gt;</description>
    <pubDate>Tue, 30 Jun 2026 20:31:08 +0000</pubDate>
    <guid>https://weworkremotely.com/remote-jobs/highlevel-product-solutions-engineer</guid>
    <link>https://weworkremotely.com/remote-jobs/highlevel-product-solutions-engineer</link>
  </item>
</channel></rss>`;

describe("parseWwrItems", () => {
  it("RSS gövdesini ham item objelerine ayırır", () => {
    const items = parseWwrItems(sampleRss);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Highlevel: Product Solutions Engineer",
      link: "https://weworkremotely.com/remote-jobs/highlevel-product-solutions-engineer",
      region: "Anywhere in the World",
      pubDate: "Tue, 30 Jun 2026 20:31:08 +0000",
    });
  });

  it("item yoksa boş dizi döner", () => {
    expect(parseWwrItems("<rss><channel></channel></rss>")).toEqual([]);
  });
});

describe("normalizeWeWorkRemotely", () => {
  it("ham item'ı PoolJobUpsert'e çevirir + HTML'i düz metne indirger + slug external_id", () => {
    const raw = parseWwrItems(sampleRss)[0];
    expect(normalizeWeWorkRemotely(raw)).toEqual({
      source: "weworkremotely",
      external_id: "highlevel-product-solutions-engineer",
      title: "Highlevel: Product Solutions Engineer",
      description: "Build great things",
      url: "https://weworkremotely.com/remote-jobs/highlevel-product-solutions-engineer",
      budget: null,
      skills: [],
      client_country: "Anywhere in the World",
      client_spent: null,
      posted_at: "2026-06-30T20:31:08.000Z",
      job_type: null,
    });
  });

  it("title veya link eksikse null döner (atlanır)", () => {
    expect(normalizeWeWorkRemotely({ title: "X", region: "R" })).toBeNull();
    expect(normalizeWeWorkRemotely({ link: "https://x.co/y", region: "R" })).toBeNull();
    expect(normalizeWeWorkRemotely("garbage")).toBeNull();
  });

  it("geçersiz pubDate'de posted_at null olur", () => {
    const r = normalizeWeWorkRemotely({ title: "X", link: "https://weworkremotely.com/remote-jobs/x", pubDate: "not-a-date" });
    expect(r).toMatchObject({ external_id: "x", posted_at: null });
  });
});
