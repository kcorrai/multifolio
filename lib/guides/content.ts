// SEO cornerstone rehberleri (bilingual). İçerik i18n katalogunda DEĞİL (şişirmemek
// için) — bu modülde yapılandırılmış; route locale'e göre seçer. Her rehber ilgili
// ücretsiz araca yönlendirir (edinim hunisi).

export interface GuideSection {
  heading: string;
  body: string[];
}
export interface GuideLocaleContent {
  title: string;
  description: string;
  sections: GuideSection[];
}
export interface Guide {
  slug: string;
  readingMinutes: number;
  toolHref: string;
  en: GuideLocaleContent;
  tr: GuideLocaleContent;
}

export const GUIDES: Guide[] = [
  {
    slug: "upwork-proposal-guide",
    readingMinutes: 4,
    toolHref: "/proposal-checker",
    en: {
      title: "How to write an Upwork proposal that wins",
      description:
        "A short, practical guide to freelance proposals that actually get replies — with the exact structure top freelancers use.",
      sections: [
        {
          heading: "Lead with the client's goal, not your bio",
          body: [
            "Most proposals open with \"I am a hard-working developer with 5 years of experience.\" Clients skim right past that. Open instead by naming the outcome they want, and reference a concrete detail from their post so they know a real person read it.",
            "One or two sentences is enough — show you understood the job before you talk about yourself.",
          ],
        },
        {
          heading: "Prove you can do it — with a number",
          body: [
            "Follow your opener with a single proof-of-fit line: their need, a relevant result you delivered, and confidence you can repeat it. Numbers make it believable — \"cut load time 40%\", \"shipped in 2 weeks\", \"grew signups 3x\".",
            "One strong, specific example beats a paragraph of adjectives.",
          ],
        },
        {
          heading: "Keep it short — 120 to 180 words",
          body: [
            "Clients read dozens of proposals; long ones get skipped. Aim for 120–180 words: opener, proof, a sentence on your approach, and a close. Cut anything that isn't about their project.",
          ],
        },
        {
          heading: "Close with a question",
          body: [
            "End with a specific question or a clear next step — \"What's your ideal launch date?\" invites a reply and starts a conversation. A proposal that ends with a question converts far better than one that trails off with \"Looking forward to hearing from you.\"",
          ],
        },
        {
          heading: "Avoid the clichés that get ignored",
          body: [
            "Skip \"Dear Sir/Madam\", \"I am the best\", \"hard-working team player\", and \"please find attached\". They signal a copy-paste. Write like a person talking to a person.",
          ],
        },
      ],
    },
    tr: {
      title: "Kazandıran bir Upwork teklifi nasıl yazılır",
      description:
        "Gerçekten yanıt alan freelance teklifleri için kısa, pratik bir rehber — en iyi freelancer'ların kullandığı yapıyla.",
      sections: [
        {
          heading: "Kendini değil, müşterinin hedefini öne al",
          body: [
            "Çoğu teklif \"5 yıl deneyimli, çalışkan bir geliştiriciyim\" diye açılır. Müşteri bunu atlar. Bunun yerine istedikleri sonucu adlandırarak aç ve ilandan somut bir ayrıntıya değin ki gerçek bir insanın okuduğunu anlasınlar.",
            "Bir iki cümle yeter — kendinden bahsetmeden önce işi anladığını göster.",
          ],
        },
        {
          heading: "Yapabildiğini kanıtla — sayıyla",
          body: [
            "Açılışın ardından tek bir uyum kanıtı cümlesi ver: ihtiyaçları, verdiğin ilgili bir sonuç ve tekrarlayabileceğin güven. Sayılar inandırıcı kılar — \"yükleme süresini %40 düşürdüm\", \"2 haftada teslim ettim\", \"kayıtları 3 katına çıkardım\".",
            "Güçlü ve spesifik tek bir örnek, bir paragraf sıfattan iyidir.",
          ],
        },
        {
          heading: "Kısa tut — 120 ila 180 kelime",
          body: [
            "Müşteri düzinelerce teklif okur; uzun olanlar atlanır. 120–180 kelime hedefle: açılış, kanıt, yaklaşımına dair bir cümle ve kapanış. Projeleriyle ilgili olmayan her şeyi çıkar.",
          ],
        },
        {
          heading: "Bir soruyla bitir",
          body: [
            "Spesifik bir soru veya net bir sonraki adımla bitir — \"İdeal yayın tarihiniz nedir?\" yanıt davet eder ve sohbet başlatır. Soruyla biten bir teklif, \"Sizden haber beklerim\" ile sönümlenenden çok daha iyi dönüşür.",
          ],
        },
        {
          heading: "Görmezden gelinen klişelerden kaçın",
          body: [
            "\"Sayın yetkili\", \"en iyisiyim\", \"çalışkan ekip oyuncusu\" ve \"özgeçmişimi ekledim\" gibi ifadeleri atla. Bunlar kopyala-yapıştır sinyali verir. Bir insanla konuşan bir insan gibi yaz.",
          ],
        },
      ],
    },
  },
  {
    slug: "freelance-rate-guide",
    readingMinutes: 4,
    toolHref: "/rate",
    en: {
      title: "How to set your freelance rate (without guessing)",
      description:
        "Work backwards from the income you actually want to a rate that covers taxes, platform fees and time off.",
      sections: [
        {
          heading: "Start from take-home, not a market average",
          body: [
            "Copying \"the going rate\" ignores your costs and goals. Start from the opposite end: the net income you want each month. Everything else — fees, taxes, unpaid time — gets added on top of that number.",
          ],
        },
        {
          heading: "Only count billable hours",
          body: [
            "You can't bill 40 hours a week. Admin, sales, learning and breaks eat a big chunk. Realistic billable time is often 20–30 hours per week. Divide your annual income target by your real billable hours, not by 2,080.",
            "Don't forget weeks off — holidays, sick days and gaps between clients.",
          ],
        },
        {
          heading: "Add back platform fees and taxes",
          body: [
            "If a platform takes 10–20% and tax takes another slice, the rate a client pays must be higher than your take-home divided by hours. Gross it up so what lands in your account matches your goal.",
          ],
        },
        {
          heading: "Sanity-check against the market",
          body: [
            "Once you have a number, compare it to what similar freelancers charge on your platforms. If your target rate is far above the market, you may need more billable hours, lower costs, or a higher-value niche — not a lower goal.",
          ],
        },
      ],
    },
    tr: {
      title: "Freelance ücretini nasıl belirlersin (tahmin etmeden)",
      description:
        "Gerçekten istediğin gelirden geriye doğru; vergi, platform komisyonu ve izinleri karşılayan bir ücrete ulaş.",
      sections: [
        {
          heading: "Piyasa ortalamasından değil, eline geçenden başla",
          body: [
            "\"Gidiş fiyatını\" kopyalamak maliyetlerini ve hedeflerini yok sayar. Tam tersinden başla: her ay eline geçmesini istediğin net gelir. Geri kalan her şey — komisyon, vergi, ücretsiz zaman — bu sayının üzerine eklenir.",
          ],
        },
        {
          heading: "Yalnızca faturalanabilir saatleri say",
          body: [
            "Haftada 40 saat faturalayamazsın. İdari iş, satış, öğrenme ve molalar büyük bir kısmı yer. Gerçekçi faturalanabilir süre çoğu zaman haftada 20–30 saattir. Yıllık gelir hedefini gerçek faturalanabilir saatlerine böl, 2.080'e değil.",
            "İzinleri unutma — tatil, hastalık ve müşteriler arasındaki boşluklar.",
          ],
        },
        {
          heading: "Platform komisyonu ve vergiyi geri ekle",
          body: [
            "Platform %10–20 alıyorsa ve vergi bir dilim daha alıyorsa, müşterinin ödediği ücret, eline geçen / saat oranından yüksek olmalı. Hesabına düşen tutar hedefinle eşleşsin diye brütleştir.",
          ],
        },
        {
          heading: "Piyasaya karşı mantık kontrolü yap",
          body: [
            "Bir sayın olduğunda, platformlarındaki benzer freelancer'ların ücretiyle karşılaştır. Hedef ücretin piyasanın çok üstündeyse; daha fazla faturalanabilir saat, daha düşük maliyet veya daha değerli bir niş gerekebilir — hedefini düşürmek değil.",
          ],
        },
      ],
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
