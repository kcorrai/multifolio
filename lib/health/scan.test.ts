import { describe, it, expect } from "vitest";
import { scanContent } from "./scan";

// Bulgu türlerini kolay doğrulamak için yardımcı.
function types(text: string, platform: Parameters<typeof scanContent>[1] = "upwork") {
  return scanContent(text, platform).map((f) => f.type);
}

describe("scanContent — platform muafiyeti", () => {
  it("LinkedIn taranmaz (kişisel networking profili) → boş", () => {
    expect(scanContent("Bana ulaş: ali@example.com, wa.me/905551112233", "linkedin")).toEqual([]);
  });

  it("boş metin → boş", () => {
    expect(scanContent("", "upwork")).toEqual([]);
  });

  it("temiz metinde bulgu yok", () => {
    const clean = "Senior React geliştiricisiyim. 5 yıl deneyim, ölçeklenebilir dashboard'lar kurarım.";
    expect(scanContent(clean, "fiverr")).toEqual([]);
  });
});

describe("scanContent — circumvention sinyalleri (pazaryeri platformları)", () => {
  it("e-posta adresi (high)", () => {
    const f = scanContent("Detaylar için john.doe@gmail.com adresine yaz.", "upwork");
    expect(f).toHaveLength(1);
    expect(f[0].type).toBe("email");
    expect(f[0].severity).toBe("high");
    expect(f[0].match).toContain("john.doe@gmail.com");
  });

  it("mesajlaşma uygulaması (whatsapp/telegram)", () => {
    expect(types("WhatsApp'tan yazabilirsin")).toContain("messaging");
    expect(types("Telegram: @kullanici")).toContain("messaging");
  });

  it("platform dışı ödeme (paypal / iban / dışarıda öde)", () => {
    expect(types("Ödemeyi PayPal ile alırım")).toContain("payment");
    expect(types("IBAN göndereyim")).toContain("payment");
    expect(types("Komisyon vermeyelim, dışarıda ödeyelim")).toContain("payment");
    expect(types("Let's pay directly to me")).toContain("payment");
  });

  it("TR IBAN kalıbı yakalanır", () => {
    expect(types("Hesap: TR33 0006 1005 1978 6457 8413 26")).toContain("payment");
  });

  it("TR mobil telefon numarası (high)", () => {
    expect(types("Ara: 0555 111 22 33")).toContain("phone");
    expect(types("+90 532 123 45 67")).toContain("phone");
  });

  it("dış bağlantı (medium)", () => {
    const f = scanContent("Portfolyo: https://benimsitem.com/works", "fiverr");
    const link = f.find((x) => x.type === "external_link");
    expect(link).toBeDefined();
    expect(link!.severity).toBe("medium");
  });
});

describe("scanContent — yanlış-pozitif önleme", () => {
  it("bütçe/rakam dizileri telefon sanılmaz", () => {
    expect(types("Bütçe 5000 USD, süre 30 gün, 12 sayfa.")).not.toContain("phone");
  });

  it("normal cümledeki kelimeler ödeme/mesaj sanılmaz", () => {
    expect(scanContent("Hızlı teslim ve net kapsam sunarım.", "bionluk")).toEqual([]);
  });
});

describe("scanContent — tür başına tek bulgu", () => {
  it("birden çok e-posta → tek email bulgusu", () => {
    const f = scanContent("a@x.com ve b@y.com", "armut");
    expect(f.filter((x) => x.type === "email")).toHaveLength(1);
  });

  it("karışık ihlaller birden çok türde bulgu döner", () => {
    const t = types("Mail: me@x.com, WhatsApp 0555 111 22 33, PayPal, site https://x.com");
    expect(new Set(t)).toEqual(new Set(["email", "messaging", "payment", "phone", "external_link"]));
  });
});
