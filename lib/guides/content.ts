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
  {
    slug: "fiverr-gig-guide",
    readingMinutes: 4,
    toolHref: "/analyze",
    en: {
      title: "How to optimize your Fiverr gig for more orders",
      description:
        "The levers that actually move Fiverr gigs — title, images, packages and first reviews — in a short, practical checklist.",
      sections: [
        {
          heading: "Write a title buyers actually search",
          body: [
            "Your gig title is your main keyword. Lead with the exact service a buyer would type — \"I will design a modern Shopify store\", not \"Creative solutions for your brand\". Put the clearest keyword first; Fiverr search and buyers both scan the start.",
            "Match your title, tags and category so search understands what you offer.",
          ],
        },
        {
          heading: "Make the thumbnail do the selling",
          body: [
            "The gig image wins the click in a grid of competitors. Show the actual result — a clean mockup, a before/after — keep any text minimal and readable at thumbnail size, and stay consistent across your gigs so your profile looks intentional.",
          ],
        },
        {
          heading: "Structure packages to raise average order",
          body: [
            "Three tiers beat one price. Anchor with a Basic that's easy to say yes to, make Standard the obvious best value, and let Premium capture bigger budgets. Describe each tier in concrete deliverables, not vague adjectives.",
          ],
        },
        {
          heading: "Earn the first reviews fast",
          body: [
            "New gigs rank low until they have social proof. Deliver your first orders quickly, over-deliver slightly, then politely ask happy buyers for a review. Early momentum compounds — reviews lift ranking, ranking brings orders.",
          ],
        },
      ],
    },
    tr: {
      title: "Fiverr gig'ini daha çok sipariş için nasıl optimize edersin",
      description:
        "Fiverr gig'lerini gerçekten hareket ettiren kaldıraçlar — başlık, görseller, paketler ve ilk yorumlar — kısa, pratik bir kontrol listesinde.",
      sections: [
        {
          heading: "Alıcıların gerçekten arattığı bir başlık yaz",
          body: [
            "Gig başlığın ana anahtar kelimendir. Alıcının yazacağı tam hizmetle aç — \"Modern bir Shopify mağazası tasarlarım\", \"Markanız için yaratıcı çözümler\" değil. En net anahtar kelimeyi başa koy; hem Fiverr araması hem alıcı başı tarar.",
            "Başlık, etiket ve kategorini eşleştir ki arama ne sunduğunu anlasın.",
          ],
        },
        {
          heading: "Küçük görsel satışı yapsın",
          body: [
            "Gig görseli, rakip ızgarasında tıklamayı kazanan şeydir. Gerçek sonucu göster — temiz bir mockup, bir öncesi/sonrası — varsa metni az ve küçük boyutta okunur tut, gig'lerin arasında tutarlı ol ki profilin bilinçli görünsün.",
          ],
        },
        {
          heading: "Ortalama siparişi artıracak paketler kur",
          body: [
            "Üç kademe tek fiyatı yener. Evet demesi kolay bir Basic ile çıpala, Standard'ı bariz en iyi değer yap, Premium daha büyük bütçeleri yakalasın. Her kademeyi belirsiz sıfatlarla değil somut çıktılarla anlat.",
          ],
        },
        {
          heading: "İlk yorumları hızlı kazan",
          body: [
            "Yeni gig'ler sosyal kanıt olana kadar düşük sıralanır. İlk siparişleri hızlı teslim et, biraz fazlasını ver, sonra memnun alıcılardan kibarca yorum iste. Erken ivme birikir — yorumlar sıralamayı, sıralama siparişi getirir.",
          ],
        },
      ],
    },
  },
  {
    slug: "profile-optimization-guide",
    readingMinutes: 4,
    toolHref: "/analyze",
    en: {
      title: "Freelance profile optimization: a headline & summary that convert",
      description:
        "Turn a generic profile into one that ranks in search and makes clients want to hire you — headline, summary and keywords.",
      sections: [
        {
          heading: "Lead your headline with the outcome",
          body: [
            "Your headline is the one line clients and search both read. Skip \"Passionate freelancer\". State who you help and the result you deliver — \"React developer helping SaaS teams ship faster\". Specific beats broad.",
          ],
        },
        {
          heading: "Structure the summary: hook, proof, offer",
          body: [
            "Open with one sentence on the problem you solve. Follow with proof — a result, a metric, a recognizable client or stack. Close with what to do next. Keep it skimmable: short paragraphs, no wall of text.",
          ],
        },
        {
          heading: "Add the keywords clients search for",
          body: [
            "Platforms rank profiles on keywords. Weave the exact skills and tools buyers search (React, Next.js, Shopify) naturally into your headline, summary and skills — spelled out, and where useful with acronyms.",
          ],
        },
        {
          heading: "Cut the things that quietly hurt you",
          body: [
            "Remove buzzwords (\"ninja\", \"guru\", \"passionate\"), fix typos, and don't list skills you can't back up. A tight, honest profile converts better than an inflated one.",
          ],
        },
      ],
    },
    tr: {
      title: "Freelance profil optimizasyonu: dönüştüren bir başlık ve özet",
      description:
        "Jenerik bir profili, aramada üst sırada çıkan ve müşterilere seni işe aldırtan bir profile çevir — başlık, özet ve anahtar kelimeler.",
      sections: [
        {
          heading: "Başlığını sonuçla aç",
          body: [
            "Başlığın, hem müşterinin hem aramanın okuduğu tek satırdır. \"Tutkulu freelancer\"ı geç. Kime yardım ettiğini ve verdiğin sonucu söyle — \"SaaS ekiplerinin daha hızlı yayına almasına yardım eden React geliştirici\". Spesifik, geneli yener.",
          ],
        },
        {
          heading: "Özeti kur: kanca, kanıt, teklif",
          body: [
            "Çözdüğün problemle tek cümlede aç. Kanıtla devam et — bir sonuç, bir metrik, tanınan bir müşteri veya teknoloji. Ne yapılacağıyla bitir. Taranabilir tut: kısa paragraflar, metin duvarı yok.",
          ],
        },
        {
          heading: "Müşterilerin arattığı anahtar kelimeleri ekle",
          body: [
            "Platformlar profilleri anahtar kelimeye göre sıralar. Alıcıların arattığı tam beceri ve araçları (React, Next.js, Shopify) başlık, özet ve becerilerine doğal biçimde yerleştir — açık yazılmış, gerektiğinde akronimlerle.",
          ],
        },
        {
          heading: "Sessizce zarar veren şeyleri çıkar",
          body: [
            "Klişeleri (\"ninja\", \"guru\", \"tutkulu\") kaldır, yazım hatalarını düzelt ve arkasında duramayacağın becerileri listeleme. Sıkı ve dürüst bir profil, şişirilmişten daha iyi dönüşür.",
          ],
        },
      ],
    },
  },
  {
    slug: "first-clients-guide",
    readingMinutes: 4,
    toolHref: "/proposal-checker",
    en: {
      title: "How to land your first 5 freelance clients",
      description:
        "A practical path from zero to your first paying clients — niche, proof, outreach and pricing that gets you started.",
      sections: [
        {
          heading: "Niche down so you're the obvious choice",
          body: [
            "\"I do everything\" attracts no one. Pick one service for one type of client — \"landing pages for SaaS startups\". A narrow focus makes your pitch, portfolio and pricing all sharper, and makes referrals easy.",
          ],
        },
        {
          heading: "Build proof before you have clients",
          body: [
            "No clients yet? Create 2–3 sample projects for real or imagined brands, or offer one discounted project in exchange for a testimonial. A portfolio with real work beats an empty profile every time.",
          ],
        },
        {
          heading: "Go where your first clients already are",
          body: [
            "Don't just wait on job boards. Answer questions where your buyers hang out, reach out to small businesses that clearly need your service, and tell your network exactly what you do. Your first client is often one warm intro away.",
          ],
        },
        {
          heading: "Price to start, then raise fast",
          body: [
            "Your first few projects can be priced to win — the goal is reviews and momentum, not maximizing this invoice. Over-deliver, collect the testimonial, then raise your rate for the next client.",
          ],
        },
      ],
    },
    tr: {
      title: "İlk 5 freelance müşterini nasıl kazanırsın",
      description:
        "Sıfırdan ilk ödeyen müşterilerine pratik bir yol — niş, kanıt, ulaşım ve seni başlatan fiyatlama.",
      sections: [
        {
          heading: "Nişe in ki bariz tercih ol",
          body: [
            "\"Her şeyi yaparım\" kimseyi çekmez. Bir müşteri tipi için tek hizmet seç — \"SaaS girişimleri için landing page'ler\". Dar bir odak; pitch'ini, portfolyonu ve fiyatlamanı keskinleştirir, referansı kolaylaştırır.",
          ],
        },
        {
          heading: "Müşterin olmadan kanıt oluştur",
          body: [
            "Henüz müşteri yok mu? Gerçek veya hayali markalar için 2–3 örnek proje üret ya da bir yorum karşılığında indirimli bir proje sun. Gerçek işli bir portfolyo, boş profili her zaman yener.",
          ],
        },
        {
          heading: "İlk müşterilerinin zaten olduğu yere git",
          body: [
            "Sadece ilan panolarında bekleme. Alıcılarının bulunduğu yerde sorulara cevap ver, hizmetine açıkça ihtiyacı olan küçük işletmelere ulaş ve çevrene tam olarak ne yaptığını söyle. İlk müşterin çoğu zaman bir sıcak tanışma uzağındadır.",
          ],
        },
        {
          heading: "Başlamak için fiyatla, sonra hızlı yükselt",
          body: [
            "İlk birkaç projeni kazanmak için fiyatlayabilirsin — amaç bu faturayı büyütmek değil, yorum ve ivme. Fazlasını ver, yorumu topla, sonraki müşteri için ücretini yükselt.",
          ],
        },
      ],
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
