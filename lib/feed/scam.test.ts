import { describe, it, expect } from "vitest";
import { scanJobListing } from "./scam";

function types(text: string) {
  return scanJobListing(text).map((f) => f.type);
}

describe("scanJobListing — temiz ilanlar (yanlış-pozitif olmamalı)", () => {
  it("boş metin → boş", () => {
    expect(scanJobListing("")).toEqual([]);
  });

  it("normal remote iş ilanı → bulgu yok", () => {
    const clean =
      "We are hiring a Senior React developer to build dashboards. Competitive salary, " +
      "remote-first, flexible hours. Apply through our careers page. Experience with TypeScript required.";
    expect(scanJobListing(clean)).toEqual([]);
  });

  it("web3/kripto ŞİRKETİ ilanı (ödeme bağlamı yok) → crypto bulgusu YOK", () => {
    const web3 =
      "Join our crypto exchange as a frontend engineer. You will build Bitcoin and Ethereum " +
      "trading interfaces. Strong React skills needed.";
    expect(types(web3)).not.toContain("crypto_payment");
  });

  it("meşru 'equipment provided' ifadesi → upfront bulgusu YOK", () => {
    expect(types("All equipment provided. No fees, ever.")).not.toContain("upfront_payment");
  });
});

describe("scanJobListing — dolandırıcılık sinyalleri", () => {
  it("platform dışı başvuru (telegram/whatsapp)", () => {
    expect(types("Interested? Contact us on Telegram for details.")).toContain("offplatform");
    expect(types("To apply, message me on WhatsApp.")).toContain("offplatform");
    expect(types("Reach out via t.me/hiring_bot now")).toContain("offplatform");
  });

  it("önden ödeme / kit satın alma", () => {
    expect(types("A one-time registration fee is required to start.")).toContain("upfront_payment");
    expect(types("You must buy the starter kit before you begin.")).toContain("upfront_payment");
    expect(types("Pay a small deposit first, refundable later.")).toContain("upfront_payment");
  });

  it("kripto ile ödeme", () => {
    expect(types("Weekly payment in Bitcoin, no bank needed.")).toContain("crypto_payment");
    expect(types("Salary paid in USDT to your wallet.")).toContain("crypto_payment");
  });

  it("hassas finansal/kimlik bilgisi talebi", () => {
    expect(types("Send your bank account number to receive funds.")).toContain("financial_info");
    expect(types("Please provide a photo of your passport to proceed.")).toContain("financial_info");
  });

  it("tür başına en fazla bir bulgu + match doldurulur", () => {
    const f = scanJobListing("Contact on Telegram. Also message on WhatsApp.");
    expect(f.filter((x) => x.type === "offplatform")).toHaveLength(1);
    expect(f[0].match.length).toBeGreaterThan(0);
  });
});
