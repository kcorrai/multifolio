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
  {
    slug: "linkedin-freelance-clients-guide",
    readingMinutes: 4,
    toolHref: "/headline-optimizer",
    en: {
      title: "How to get freelance clients on LinkedIn",
      description:
        "Turn your LinkedIn profile into a steady source of inbound freelance work — headline, profile, content and outreach that actually land clients.",
      sections: [
        {
          heading: "Make your headline say who you help",
          body: [
            "Your LinkedIn headline shows up everywhere — in search, comments and messages. \"Freelancer\" or a job title tells a client nothing. Say who you help and the outcome you deliver: \"I help SaaS teams ship faster as a freelance React developer.\"",
            "Specific beats broad. A clear headline makes the right people click, and the wrong ones scroll past.",
          ],
        },
        {
          heading: "Turn your profile into a landing page",
          body: [
            "Treat your About section like a pitch, not a résumé. Open with the problem you solve, back it with proof — results, recognizable clients, a stack — and end with a clear next step (\"DM me to talk about your project\").",
            "Feature your best work in the Featured section so a visitor sees proof without leaving your profile.",
          ],
        },
        {
          heading: "Post so the right clients find you",
          body: [
            "You don't need to go viral. Share short, useful posts about the problems your clients face — a fix you shipped, a mistake you see often, a before/after. Consistency compounds: a few focused posts a week keeps you visible to the people who hire.",
          ],
        },
        {
          heading: "Reach out without being spammy",
          body: [
            "Cold pitches that open with \"I offer web development services\" get ignored. Comment thoughtfully on a prospect's posts first, then send a short message that references their work and offers a specific idea — not a sales script.",
          ],
        },
      ],
    },
    tr: {
      title: "LinkedIn'de freelance müşteri nasıl bulunur",
      description:
        "LinkedIn profilini istikrarlı bir inbound freelance iş kaynağına çevir — başlık, profil, içerik ve gerçekten müşteri kazandıran ulaşım.",
      sections: [
        {
          heading: "Başlığın kime yardım ettiğini söylesin",
          body: [
            "LinkedIn başlığın her yerde görünür — aramada, yorumlarda, mesajlarda. \"Freelancer\" veya bir unvan müşteriye bir şey anlatmaz. Kime yardım ettiğini ve verdiğin sonucu söyle: \"SaaS ekiplerinin daha hızlı yayına almasına yardım eden freelance React geliştiricisiyim.\"",
            "Spesifik, geneli yener. Net bir başlık doğru insanları tıklatır, yanlışları kaydırıp geçirir.",
          ],
        },
        {
          heading: "Profilini bir landing page'e çevir",
          body: [
            "Hakkında bölümünü özgeçmiş gibi değil, bir pitch gibi ele al. Çözdüğün problemle aç, kanıtla destekle — sonuçlar, tanınan müşteriler, teknoloji — ve net bir sonraki adımla bitir (\"Projeni konuşmak için DM at\").",
            "En iyi işlerini Öne Çıkanlar bölümünde göster ki ziyaretçi profilden çıkmadan kanıtı görsün.",
          ],
        },
        {
          heading: "Doğru müşteriler seni bulsun diye paylaş",
          body: [
            "Viral olmana gerek yok. Müşterilerinin karşılaştığı sorunlara dair kısa, faydalı gönderiler paylaş — teslim ettiğin bir çözüm, sık gördüğün bir hata, bir öncesi/sonrası. Tutarlılık birikir: haftada birkaç odaklı gönderi seni işe alacak kişilerin gözünde tutar.",
          ],
        },
        {
          heading: "Spam yapmadan ulaş",
          body: [
            "\"Web geliştirme hizmeti sunuyorum\" diye açılan soğuk mesajlar görmezden gelinir. Önce adayın gönderilerine düşünceli yorum yap, sonra işine değinen ve spesifik bir fikir sunan kısa bir mesaj gönder — satış metni değil.",
          ],
        },
      ],
    },
  },
  {
    slug: "avoid-freelance-scams-guide",
    readingMinutes: 4,
    toolHref: "/analyze",
    en: {
      title: "How to spot freelance job scams before they cost you",
      description:
        "The red flags of fake freelance jobs — off-platform payment, upfront fees, too-good offers — and simple rules to keep your time and money safe.",
      sections: [
        {
          heading: "Never move off-platform to get paid",
          body: [
            "The most common scam is a \"client\" who wants to move to Telegram, WhatsApp or email right away and pay outside the platform. Off-platform means no protection: no dispute, no record, no recourse. Keep conversations and payments where the platform can back you up.",
          ],
        },
        {
          heading: "No legitimate job asks you to pay first",
          body: [
            "If you're asked to buy software, pay a \"training\" or \"registration\" fee, or send money to unlock a job, it's a scam. Real clients pay you — you never pay to work. Walk away the moment money flows the wrong direction.",
          ],
        },
        {
          heading: "Be wary of offers that are too good",
          body: [
            "\"$50/hour for simple data entry, no experience needed\" is bait. Unusually high pay for trivial work, instant hiring with no interview, or vague job descriptions are classic red flags. If it feels too easy, it usually is.",
          ],
        },
        {
          heading: "Check the client before you invest time",
          body: [
            "Look at the client's history, reviews and verification before writing a long proposal. A brand-new account, no payment verified, a rushed tone, or a copy-paste message sent to everyone are all signals to slow down. A quick check saves hours.",
          ],
        },
      ],
    },
    tr: {
      title: "Freelance iş dolandırıcılığını sana pahalıya patlamadan nasıl anlarsın",
      description:
        "Sahte freelance işlerin kırmızı bayrakları — platform dışı ödeme, peşin ücret, fazla iyi teklifler — ve zamanını ve paranı koruyan basit kurallar.",
      sections: [
        {
          heading: "Ödeme için asla platform dışına çıkma",
          body: [
            "En sık dolandırıcılık, hemen Telegram, WhatsApp veya e-postaya geçip platform dışında ödemek isteyen bir \"müşteri\"dir. Platform dışı = koruma yok: itiraz yok, kayıt yok, başvuru yolu yok. Konuşmayı ve ödemeyi platformun seni koruyabildiği yerde tut.",
          ],
        },
        {
          heading: "Meşru bir iş senden önce ödeme istemez",
          body: [
            "Yazılım satın alman, bir \"eğitim\" veya \"kayıt\" ücreti ödemen ya da işi açmak için para göndermen isteniyorsa, bu dolandırıcılıktır. Gerçek müşteriler sana öder — çalışmak için asla ödeme yapmazsın. Para ters yöne aktığı an uzaklaş.",
          ],
        },
        {
          heading: "Fazla iyi tekliflerden şüphelen",
          body: [
            "\"Basit veri girişi için saati 50$, deneyim gerekmez\" bir yemdir. Önemsiz iş için alışılmadık yüksek ödeme, mülakatsız anında işe alım veya belirsiz iş açıklamaları klasik kırmızı bayraklardır. Fazla kolay geliyorsa, genelde öyledir.",
          ],
        },
        {
          heading: "Zaman yatırmadan müşteriyi kontrol et",
          body: [
            "Uzun bir teklif yazmadan önce müşterinin geçmişine, yorumlarına ve doğrulamasına bak. Yepyeni bir hesap, doğrulanmamış ödeme, aceleci bir ton veya herkese gönderilen kopyala-yapıştır bir mesaj; hepsi yavaşlama sinyalidir. Hızlı bir kontrol saatler kazandırır.",
          ],
        },
      ],
    },
  },
  {
    slug: "ats-truth-guide",
    readingMinutes: 5,
    toolHref: "/ats-check",
    en: {
      title: "The truth about ATS: what actually gets your resume read",
      description:
        "The '75% of resumes are auto-rejected by ATS' claim is a myth. Here's what really decides whether a human reads your resume — and how to pass.",
      sections: [
        {
          heading: "The '75% auto-rejected' stat is made up",
          body: [
            "That number traces back to a resume-software vendor that went out of business over a decade ago and never published any methodology. It gets repeated as 70%, 75%, or 88% depending on the blog — a sign nobody has real data. In reality, recruiters report that the large majority of applications are seen by a human, and only a small fraction of employers configure content-based auto-rejection at all.",
            "So stop optimizing out of fear of a black box. Optimize for two real things: keyword alignment and clean parsing.",
          ],
        },
        {
          heading: "Put the exact job title on your resume",
          body: [
            "This is the single highest-leverage move. Large-sample analysis found resumes containing the literal job title from the posting got many times more interview invitations. If the role is 'Frontend Engineer', those exact words should appear — in your headline or a recent role — not just 'web developer'.",
            "Then mirror the specific skills and tools named in the posting. Aim to cover roughly 60–80% of the important keywords, using the same words the employer used (not synonyms).",
          ],
        },
        {
          heading: "Don't break the parser",
          body: [
            "Real parsing failures come from formatting, not secret AI judgment: multi-column layouts (text reads out of order), text boxes (often invisible to the parser), contact info stuck in the header/footer (many systems skip those), non-standard section names ('My Journey' instead of 'Work Experience'), and decorative icons or exotic fonts. Use a single-column layout, standard headings, and put your contact details in the body.",
          ],
        },
        {
          heading: "Quantify your bullets",
          body: [
            "Use the pattern: accomplished [X], measured by [Y], by doing [Z]. Bullets with a number — 'cut build time 35%', 'led a team of 4', 'shipped 12 releases' — read as achievements; bullets without one read as duties. If a bullet has no number, ask what changed because of your work and add it.",
          ],
        },
        {
          heading: "One page or two?",
          body: [
            "Under ~5 years of experience: one page. Ten or more years, or many relevant roles: two pages is fine and often preferred — don't cram a senior career onto one page. Length isn't the enemy; irrelevance is.",
          ],
        },
      ],
    },
    tr: {
      title: "ATS hakkında gerçek: özgeçmişini gerçekte ne okutur",
      description:
        "'Özgeçmişlerin %75'i ATS tarafından otomatik reddedilir' iddiası bir efsane. Bir insanın özgeçmişini okumasını gerçekte ne belirler — ve nasıl geçilir.",
      sections: [
        {
          heading: "'%75 otomatik red' istatistiği uydurma",
          body: [
            "Bu rakam, on yıldan uzun süre önce kapanan ve hiçbir yöntem yayımlamamış bir özgeçmiş-yazılımı satıcısına dayanıyor. Bloglara göre %70, %75 ya da %88 diye tekrarlanıyor — kimsenin gerçek verisi olmadığının işareti. Gerçekte işe alımcılar başvuruların büyük çoğunluğunun bir insan tarafından görüldüğünü söylüyor; içeriğe göre otomatik red kuran işveren oranı çok düşük.",
            "O yüzden bir kara kutu korkusuyla optimize etmeyi bırak. İki gerçek şey için optimize et: anahtar kelime hizalaması ve temiz ayrıştırma (parsing).",
          ],
        },
        {
          heading: "İlandaki birebir iş unvanını özgeçmişine koy",
          body: [
            "Bu en yüksek kaldıraçlı tek hamle. Büyük örneklemli analizler, ilandaki iş unvanını birebir içeren özgeçmişlerin kat kat fazla mülakat daveti aldığını buldu. Pozisyon 'Frontend Engineer' ise, o birebir kelimeler — başlığında veya güncel bir rolde — geçmeli; yalnızca 'web geliştirici' değil.",
            "Ardından ilanda adı geçen spesifik beceri ve araçları yansıt. Önemli anahtar kelimelerin kabaca %60-80'ini, işverenin kullandığı kelimelerle (eş anlamlısıyla değil) karşılamayı hedefle.",
          ],
        },
        {
          heading: "Ayrıştırıcıyı bozma",
          body: [
            "Gerçek ayrıştırma hataları gizli bir AI kararından değil, formattan gelir: çok sütunlu düzenler (metin sırayı bozar), metin kutuları (ayrıştırıcıya çoğu kez görünmez), üst/alt bilgiye sıkışmış iletişim bilgisi (birçok sistem bunları atlar), standart-dışı bölüm adları ('Yolculuğum' yerine 'İş Deneyimi') ve dekoratif ikon/egzotik yazı tipleri. Tek sütunlu düzen, standart başlıklar kullan ve iletişim bilgini gövdeye koy.",
          ],
        },
        {
          heading: "Maddelerini rakamla destekle",
          body: [
            "Şu kalıbı kullan: [X]'i başardım, [Y] ile ölçüldü, [Z] yaparak. Rakam içeren maddeler — 'derleme süresini %35 düşürdüm', '4 kişilik ekip yönettim', '12 sürüm yayınladım' — başarı gibi okunur; rakamsız maddeler görev gibi. Bir maddede rakam yoksa, senin işin sayesinde ne değiştiğini sor ve ekle.",
          ],
        },
        {
          heading: "Tek sayfa mı, iki mi?",
          body: [
            "~5 yıldan az deneyim: tek sayfa. On yıl ve üzeri, ya da çok sayıda ilgili rol: iki sayfa gayet iyi ve çoğu kez tercih edilir — kıdemli bir kariyeri tek sayfaya sıkıştırma. Düşman uzunluk değil, alakasızlıktır.",
          ],
        },
      ],
    },
  },
  {
    slug: "interview-prep-guide",
    readingMinutes: 5,
    toolHref: "/analyze",
    en: {
      title: "Interview prep that works: STAR stories, your pitch, and the questions to ask",
      description:
        "A simple, evidence-backed framework to walk into any interview ready — build a story bank, nail 'tell me about yourself', and finish strong.",
      sections: [
        {
          heading: "Build a STAR story bank",
          body: [
            "Most behavioral questions ('tell me about a time you…') are answered with the STAR method: Situation, Task, Action, Result. Prepare 4–6 stories from your real projects. The Action — what you personally did — should be the longest, most specific part; that's what interviewers are actually evaluating. End each with a concrete result, ideally a number.",
            "Pull these from work you've actually done, so they hold up under follow-up questions.",
          ],
        },
        {
          heading: "Nail 'tell me about yourself'",
          body: [
            "Use Present → Past → Future: what you do now and a recent win, the relevant thread of how you got here, and why this role is the logical next step. Keep it to about 90 seconds (150–200 words). This is almost always the first question — a crisp answer sets the tone.",
          ],
        },
        {
          heading: "Answer the weakness question well",
          body: [
            "Pick a real, non-core weakness — never something the job lists as essential — and pair it with a concrete action you're taking to improve. Avoid character flaws (dishonesty, poor communication); those read as unfixable. 'I used to over-polish before shipping; now I timebox and ship a first version for feedback' works.",
          ],
        },
        {
          heading: "Always have questions to ask",
          body: [
            "Bring 4–5 questions across role, team, growth, and process. Not asking any reads as disengagement. Good ones: 'What does success look like in the first 90 days?', 'How does the team make decisions?', 'What are the next steps?'",
          ],
        },
        {
          heading: "Send a thank-you note within 24 hours",
          body: [
            "A short, specific thank-you email after the interview is a small but real edge — a meaningful share of employers view skipping it negatively, and most candidates don't send one. Reference something specific from the conversation.",
          ],
        },
      ],
    },
    tr: {
      title: "İşe yarayan mülakat hazırlığı: STAR hikâyeleri, kendini anlatman ve soracağın sorular",
      description:
        "Her mülakata hazır girmen için basit, kanıta dayalı bir çerçeve — hikâye bankası kur, 'kendinden bahset'i çöz ve güçlü bitir.",
      sections: [
        {
          heading: "STAR hikâye bankası kur",
          body: [
            "Çoğu davranışsal soru ('bana bir zaman anlat…') STAR yöntemiyle yanıtlanır: Situation (Durum), Task (Görev), Action (Eylem), Result (Sonuç). Gerçek projelerinden 4-6 hikâye hazırla. Eylem — bizzat senin yaptığın — en uzun, en somut kısım olmalı; mülakatçının asıl değerlendirdiği budur. Her birini somut, tercihen rakamlı bir sonuçla bitir.",
            "Bunları gerçekten yaptığın işlerden çıkar ki takip sorularında sağlam dursun.",
          ],
        },
        {
          heading: "'Kendinden bahset'i çöz",
          body: [
            "Present → Past → Future kullan: şimdi ne yaptığın ve son bir başarın, buraya gelişinin ilgili hikâyesi ve bu rolün neden mantıklı bir sonraki adım olduğu. Yaklaşık 90 saniyede tut (150-200 kelime). Bu neredeyse her zaman ilk sorudur — net bir yanıt havayı belirler.",
          ],
        },
        {
          heading: "Zayıflık sorusunu iyi yanıtla",
          body: [
            "Gerçek ama çekirdek olmayan bir zayıflık seç — asla işin olmazsa olmazı olan bir şeyi değil — ve onu geliştirmek için attığın somut bir adımla eşle. Karakter kusurlarından (dürüstlük, iletişim zayıflığı) kaçın; onlar düzeltilemez okunur. 'Eskiden yayınlamadan önce fazla cilalardım; artık süre sınırı koyup geri bildirim için ilk sürümü çıkarıyorum' işe yarar.",
          ],
        },
        {
          heading: "Her zaman soracak soruların olsun",
          body: [
            "Rol, ekip, büyüme ve süreç üzerine 4-5 soru getir. Hiç sormamak ilgisizlik gibi okunur. İyi olanlar: 'İlk 90 günde başarı neye benziyor?', 'Ekip kararları nasıl alıyor?', 'Sonraki adımlar neler?'",
          ],
        },
        {
          heading: "24 saat içinde teşekkür notu gönder",
          body: [
            "Mülakattan sonra kısa, spesifik bir teşekkür e-postası küçük ama gerçek bir avantajdır — işverenlerin azımsanmayacak bir kısmı göndermemeyi olumsuz görür ve çoğu aday göndermez. Konuşmadan spesifik bir şeye değin.",
          ],
        },
      ],
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
