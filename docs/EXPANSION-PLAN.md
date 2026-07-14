# Genişleme Planı: Platform Sayısını Maksimize Et + İşe Girme Taktiklerini Ürünleştir

> 2026-07-14 — 4 kollu derin araştırmanın (platform manzarası, ilan API'leri, başvuru taktikleri, rakip araçlar) sentezi.
> Uygulayıcı model: Opus 4.8. Her faz bağımsız teslim edilebilir; faz sonunda `npm run check` temiz.

## Amaç

1. **Platform genişletme:** 3 platformdan (LinkedIn/Upwork/Fiverr) çıkıp global düzeyde çok kullanılan
   freelance/işe-alım platformlarını eklemek — uyarlama hedefi + ilan kaynağı + bağlantı takibi olarak.
2. **İşe girme taktiklerini ürünleştirme:** Kanıt-dereceli başvuru/profil/mülakat playbook'unu AI
   prompt'larına, checklistlere, skorlara ve rehber içeriklerine dönüştürmek.

## Araştırma Bulguları (özet)

### A) Rakip araçlar
İncelenen: Teal, Huntr, Simplify, Careerflow, Jobscan, Kickresume, Rezi, LoopCV, LazyApply, Sonara, Jobright, UpHunt, Vollna.

**Boşluklarımız (rakiplerde yaygın + talep yüksek):** uzantıda canlı eşleşme skoru (8/15), entegre AI
cover letter (10/15), teklif kalite/özgüllük skoru, mülakat prep modülü (5/15), Upwork/Fiverr profil
optimizasyon skoru (Vollna/UpHunt farklılaştırıcısı), maaş pazarlığı koçluğu (yükselen).

**Anti-feature'lar (kanıtlı backlash — YAPMA):**
- Auto-apply/auto-submit: LazyApply 2.4/5 Trustpilot, LinkedIn hesap banları, LoopCV polarize.
  Uyumlu model = insan-onaylı; uzantımızın "auto-submit YOK" kuralı korunur.
- Ham AI çıktısını "final" diye sunmak (%78 recruiter AI'ı tanıyor, %63 jenerik başvuruyu eliyor)
  → incele-düzenle akışı zorunlu (mevcut desen).
- Şeffaf olmayan abonelik → PAYG kredi modelimiz avantaj, pazarlamada vurgulanır.

### B) Platform manzarası (13 platform + yükselenler)
Stratejik uyum sıralaması:
1. **Freelancer.com** — 64M+; TEK resmî tam API'li platform (OAuth2, developers.freelancer.com,
   proje/iş feed'i dahil). Scrape yasak (ToS+Cloudflare) → yalnız API.
2. **Contra** — 1M+; portfolyo-öncelikli PUBLIC profiller (Bionluk/LinkedIn tarzı sunucudan import
   adayı); yükselen momentum; %0 komisyon; API yok. ⚠️ Talep tarafı ÇOK zayıf (platform genelinde ~325
   ilan, 2026-05/06 canlı sayım) → değeri profil-import + uyarlama; ilan feed'i olarak DEĞİL.
3. **PeoplePerHour** — 850K+; public profil+ilan, zayıf bot duvarı; bid tabanlı.
4. **99designs** — resmî API (key auth; designer search + brief); public portfolyolar; tasarım segmenti.
5. **Guru.com** — 2M; public profiller, bid. API YOK (developer.getguru.com FARKLI şirket — bilgi
   yönetimi SaaS'ı, karıştırma!). Scrape fizibilitesi test edilmeli.
6. **Braintrust (usebraintrust.com)** — API/funding iddiaları braintrust.dev (eval şirketi) ile
   karışıyor — birinci elden doğrulama şart.
7. Truelancer / Codeable — niş/uzun kuyruk (Codeable = WordPress dev personası).
8. Malt / Workana — FR-DE/ES-PT dilli → İngilizce-only kapsamla çelişir, ERTELENDİ.
- **ELENEN:** Toptal, Gun.io, Arc.dev — kapalı concierge ağları (public profil/bid/feed yok → yüzey yok).
- Not: kullanıcı sayıları düşük-otoriteli kaynaklardan (büyüklük sırası olarak al). hiQ v. LinkedIn
  içtihadı public scrape'i CFAA dışı tutar ama platform ToS ayrı — platform başına robots.txt+ToS kontrolü.

**Genel işe alım + portfolyo platformları (⚠️ model-bilgisi ağırlıklı — uygulamada doğrulanacak):**
- **GitHub** — (d)+(a): 180M+ geliştirici (Octoverse 2025, canlı doğrulandı); resmî REST/GraphQL API
  (PAT ile 5.000 istek/saat), sıfır bot duvarı; repo→proje importu en ucuz/yüksek değerli iş. GitHub Jobs
  kapalı (feed yok). AUP profil-veritabanı satmayı yasaklar — kullanıcı-onaylı kendi-profili importu temiz.
- **Wellfound (ex-AngelList Talent)** — (a)+takip: public/yarı-public aday profili; başvuru modeli
  "profil = başvuru, cover letter YOK" (canlı doğrulandı) → değer PROFİL uyarlamasında, teklifte değil.
  DataDome bot duvarı → sunucudan scrape yok; uzantı iş-yakalama uygun.
- **Behance** — (a)+(d): en büyük kreatif portfolyo ağı (65M+ üye) + Behance Hire pazarı (%0 komisyon,
  2025'te 100K+ iş — tasarım işe-alımının aktığı yer). Resmî API fiilen ÖLÜ (dev portalı 404, canlı
  doğrulandı); robots.txt AI-crawler'ları (ClaudeBot dahil) açıkça engelliyor → sunucudan scrape YOK,
  yalnız kullanıcı-onaylı/uzantı akışı.
- **Dribbble** — (a)+(d): API v2 canlı doğrulandı (OAuth2, 60 istek/dk / 1.440 istek/gün, varsayılan
  kapsam kullanıcının KENDİ verisi) → ToS-temiz kendi-portfolyosu importu meşru yol.
- **Indeed** — yalnız (b): public profil YOK, API kapalı, sert bot duvarı → uzantı iş-yakalama + CV
  uyarlama + takip hedefi olarak eklenir; profil/feed entegrasyonu YOK.
- **ÖLÜ/EKLEME (canlı doğrulandı):** Hired (LHH'ye gömüldü 2024), Monster+CareerBuilder (Chapter 11
  Haziran 2025, ~28M$'a satıldı), Stack Overflow Jobs (2022), GitHub Jobs (2021), Polywork/Read.cv.
  Glassdoor Indeed'e gömülüyor (Nisan 2026 hesap-birleştirme zorunlu); ZipRecruiter ZipSearch API'si
  Mart 2025'te öldü. 2026'da hiçbir büyük genel platformun public iş-arama/profil API'si YOK.
- **Trend (canlı doğrulandı):** genel iş panolarında cover letter YAPISAL olarak kayboluyor
  (Wellfound "no cover letters", ZipRecruiter özelliği kaldırdı, LinkedIn Easy Apply'da yok) →
  Faz 4 AI cover letter özelliği ATS/şirket başvuruları + freelance teklifleri için konumlanmalı,
  genel iş panoları için değil. Zengin tek-profil + AI eşleştirme (Mercor, micro1) yükselen model —
  Multifolio'nun "bir kez gir" vaadiyle aynı yönde.
- Self-serve ilan API'leri canlı doğrulananlar: Adzuna (developer.adzuna.com), USAJobs, RemoteOK,
  Remotive, Jooble — Faz 1 aday havuzuna güven artışı.
- ToS-temiz programatik erişim YALNIZ: Freelancer.com API, GitHub API, Dribbble OAuth. Gerisi uzantı
  yakalama / kullanıcı-yapıştırma (mevcut Upwork/Fiverr uzantı deseniyle tutarlı).

### C) Ücretsiz ilan API'leri (⚠️ DÜŞÜK GÜVEN — ajan az doğrulama yaptı; her endpoint uygulamada canlı doğrulanacak)
1. **Himalayas** — `https://himalayas.app/jobs/api` (auth yok; agregasyona açık; attribution şartı)
2. **We Work Remotely RSS** — `https://weworkremotely.com/remote-jobs.rss` (auth yok; attribution)
3. **The Muse API** — ücretsiz key; 3.600 istek/saat; tech odaklı
4. **HN "Who is hiring" (Algolia)** — auth yok; aylık thread, yorum parse gerekir (niş; opsiyonel)
5. **USAJobs API** — ücretsiz key; ABD federal (niş; agregasyon resmen teşvik)
6. Greenhouse/Lever/Ashby şirket-bazlı public JSON — endpoint trivial, şirket keşfi ayrı iş (sonraki tur)
- ATLA: Jobicy (rakibe dağıtım yasağı), Working Nomads/NoDesk/4dayweek (API yok), Reed (ToS belirsiz),
  Adzuna/Jooble/Careerjet (yüksek duplikasyon).
- **Arbeitnow GERİ EKLENMEZ** (kalite nedeniyle bilinçli düşürüldü); ancak `remote:true` filtreli sürüm tartışılabilir.
- Yasal: Remotive verisi Jooble/Google Jobs/LinkedIn Jobs'a beslenemez (mevcut yükümlülük).

### D) Başvuru taktikleri playbook (kanıt dereceli: 🟢 kanıtlı / 🟡 yön gösterici / 🔴 EFSANE)
**Kural: 🔴 rakamlar kullanıcıya ASLA gösterilmez** ("ATS efsaneleri UI'da YASAK" kuralının genişletilmesi).

- **ATS gerçeği 🟢:** "%75 oto-red" EFSANE (kaynak: 2012'de batan Preptel). Gerçek eleme: keyword
  uyumsuzluğu + parse bozan format (çok sütun, text-box, header/footer'da iletişim, standart-dışı
  bölüm başlığı). En güçlü tek kaldıraç: ilandaki **birebir iş unvanı** CV'de (Jobscan ~1M örneklem:
  10.6x mülakat daveti). Hedef keyword örtüşmesi %60-80.
- **CV uzunluğu 🟢:** ResumeGo (N=7.712): <5 yıl deneyim → 1 sayfa; ≥10 yıl → 2 sayfa (2.3x tercih).
  Bullet formülü: XYZ (Laszlo Bock/Google) — rakamsız bullet'lar revizyona işaretlenir.
- **Cover letter/teklif 🟢:** ResumeGo saha deneyi (N=7.287): kişiye-özel %16.4 vs mektupsuz %10.7;
  jenerik neredeyse işe yaramıyor (%12.5). arXiv 2509.25054: AI cilası sinyal değerini yitiriyor →
  **özgüllük** (ilandan gerçek detay + gerçek portfolyo kanıtı) tek kalıcı sinyal. Upwork resmî:
  ilk 2 satır müşteri-problemi (önizlemede yalnız o görünür); "Hi, my name is..." anti-pattern.
- **Upwork mekaniği 🟢:** Specialized Profiles KALDIRILDI (ürüne koyma). JSS: 6/12/24 ay pencerelerinin
  en iyisi, kazanç ağırlıklı. "Tam profil 4.5x" (Upwork'ün kendi verisi). Hız rakamları ("ilk 5 teklif",
  "5 dk kuralı") satıcı-blog EFSANESİ 🔴 — "erken başvur" yalnız yumuşak öneri.
- **Huni 🟡/🟢:** işverenin YEREL saatiyle 06-10 başvuru ~5x mülakat (TalentWorks N≈1.600, tek çalışma).
  Az-ama-terzi-işi > hacim. Referans 🟢 (Ashby, 38M başvuru): referanslıların %40'ı mülakata ulaşıyor →
  "referred by" alanı. Takip: 5-7 iş günü sonra 1., +7-10 gün 2., **3. YOK**. Haftalık 10-15/20-30 hedef bandı.
- **Mülakat 🟢:** STAR (DDI 1974; Action ağırlıklı) — `profiles.projects`'ten hikâye bankası üretilebilir.
  "Tell me about yourself": Present→Past→Future ~90 sn. Teşekkür notu: işverenlerin %22'sini etkiliyor
  (CareerBuilder) → mülakat sonrası 24 saat hatırlatma.
- **Fiverr 🟡:** başlıkta birincil keyword önde; 5 tag'in hepsi, başlıkla tekrarsız; Standard tier "önerilen".
- **LinkedIn 🟡:** headline ilk 80 karakter (arama önizlemesi); About ilk 2 cümle ≤15'er kelime; foto en
  yüksek kaldıraç; 3 skill pinleme.
- Güvenilir birincil kaynaklar: ResumeGo, Jobscan State of Job Search 2025, Ashby Talent Trends,
  CareerBuilder, TalentWorks, Upwork Help Center, DDI/HBR (STAR), Laszlo Bock (XYZ), arXiv:2509.25054.
- 🔴 kaynak karalisted: gigradar, snipework, ligosocial, growleads vb. satıcı-blogları — rakamları kullanılmaz.

## Uygulama Fazları

### Faz 1 — İlan kaynağı genişletme (`lib/scrape/`) — ✅ TAMAMLANDI (2026-07-14, Opus)
Desen: `sources/{id}.ts` (fetch I/O + saf `normalize` → `PoolJobUpsert`) + `sources/{id}.test.ts` + `run.ts` listesi.
**Her endpoint canlı doğrulandı** (C araştırması düşük güvenliydi — ve haklı çıktı: 3 adaydan 2'si elendi).
- ✅ **We Work Remotely RSS** EKLENDİ (`lib/scrape/sources/weworkremotely.ts` + test): kategori-filtreli
  feed'ler (`remote-programming-jobs.rss` + `remote-design-jobs.rss`), bağımlılıksız regex XML parse
  (saf `parseWwrItems` + `normalizeWeWorkRemotely`). Canlı kuru-koşu: 39 alakalı dev/design ilanı,
  hepsi junk filtresini geçti. ÇİFT-kodlanmış description (`&lt;p&gt;`) → `htmlToText` iki geçiş.
  Attribution: `job_pool.source="weworkremotely"` + pool-job-row `PlatformBadge` kaynağı gösterir.
- ❌ **Himalayas REDDEDİLDİ**: kategori query'si yok sayılıyor, 200 ilanın yalnız ~%8'i dev/design
  (101'inde parentCategory YOK) → filtrelenemez firehose, Arbeitnow gibi feed alakasını bozar.
- ❌ **The Muse REDDEDİLDİ**: `categories` alanı sorgu parametresini kopyalıyor ("Software Engineering"
  altında Corporate Counsel, Civil Engineer, hatta Lyft sürücü reklamı) → ~%50 gürültü, güvenilmez.
- HN Who-is-hiring Algolia: ilk dalgaya alınmadı (yorum parse maliyeti).
- Kalite bekçisi ilkesi uygulandı: kategori-temizliği barını geçemeyen kaynak alınmadı. `npm run check` temiz.

### Faz 2 — Platform genişletme — ✅ DALGA 1 TAMAMLANDI (2026-07-14, Opus)
Yapıldı: `platformIdSchema` 3→8 (Freelancer.com/Contra/PeoplePerHour/99designs/Guru); tüm
`Record<PlatformId>` noktaları + logo letter-mark'ları + pSEO (80 sayfa) + hub otomatik.
Kredi kontrolü: `/api/adapt/all` opsiyonel `platforms[]` + hub platform seçim çipleri (16-kredi
sürprizi önlendi). **GitHub importu EKLENDİ** (`lib/import/github.ts` + test): resmî REST API →
repo dil+topic'lerinden beceri + öne çıkan (fork olmayan) repo'lar proje; canlı doğrulandı
(gaearon: 4 dil + 6 gerçek proje). `GITHUB_TOKEN` opsiyonel (60→5000/saat). Contra sunucu-import
Dalga 2'ye bırakıldı (canlı fizibilite ayrı iş). `npm run check` temiz (355 test).

### Faz 2 — orijinal dalga yapısı
**Dalga 1 — Tier A (uyarlama+teklif):** Freelancer.com, Contra, PeoplePerHour, 99designs, Guru.
  Dokunulan dosyalar: `lib/ai/platforms.ts` (guidance + PROPOSAL_GUIDANCE + PLATFORM_LANGUAGE:"en") +
  `components/platform-logo.tsx` SVG + `lib/health/scan.ts` kapsam kararı + `lib/import/text.ts` URL
  tanıma + `lib/pseo/data.ts`. Ton/format kuralları B+D bulgularından (Freelancer/PPH/Guru bid-odaklı,
  Contra portfolyo-öncelikli, 99designs brief-yanıtı).
- **Dalga 1 import:** GitHub repo→proje importu (`lib/import/github.ts`, resmî API — Bionluk/LinkedIn
  deseni; en ucuz yüksek değerli iş) + Contra sunucudan profil import fizibilitesi (`lib/import/contra.ts`,
  canlı doğrulama şart).
- **Dalga 2 (doğrulama sonrası):** Wellfound (a+b+c), Behance (a+c+d), Dribbble (OAuth own-data import),
  Indeed (yalnız uzantı iş-yakalama+takip), Braintrust, Truelancer, Codeable.
- **Tier C (feed-only):** Freelancer.com projects API (Faz 1'e ek kaynak).
- ⚠️ `PLATFORM_IDS` büyüyünce enumerate eden UI'lar otomatik büyür: HUB kart sayısı + `/api/adapt/all`
  kredi maliyeti orantılı artar → kullanıcıya platform seçimi sunulmalı.
- Profil scrape yeni platformlarda beklenmez; içe aktarma uzantı/metin yoluyla kalır.

### Faz 3 — DURUM (2026-07-14, Opus): kısmen tamamlandı
- ✅ **AI prompt revizyonları**: `proposal.ts` (problem-first, jenerik açılış yasağı, ilandan somut
  detay + kanıt referansı), `adapt.ts` (keyword hizalama + ilk-cümle önceliği + özgüllük), `platforms.ts`
  guidance (LinkedIn ilk-80/About-ilk-2, Upwork overview-ilk-2 + specialized-profile-yok, Fiverr keyword-önde).
- ✅ **Mülakat Prep modülü (YENİ, amiral)**: `lib/ai/interview.ts` + schema + `/api/interview/prep`
  (kredili, kalıcı değil) + `interview-prep-modal.tsx` + job-detail-panel CTA (durum "interview").
  STAR (`profiles.projects`'ten, Action-ağırlıklı), tell-me (Present→Past→Future), zayıflık (must-have
  dışlar + düzeltici eylem), 4-5 soru, 24 saat teşekkür-notu hatırlatması.
- ✅ **Rehberler**: `ats-truth-guide` (75% efsanesi çürütme + birebir unvan + parse + XYZ) +
  `interview-prep-guide` (STAR + tell-me + sorular + teşekkür) — iki dilli, /guides otomatik.
- ⏭️ KALAN (sonraki tur): CV birebir-unvan skoru (hedef unvan güvenilir değil → entegrasyon tricky),
  follow-up 2. aşama kadansı, pipeline benchmark bantları, referred-by migration. ATS skoru zaten
  quantified/filler/%60-keyword/tarih ile kanıta büyük ölçüde uyumluydu.

### Faz 3 — orijinal detay
1. **AI prompt revizyonları** (`lib/ai/`): `proposal.ts`+PROPOSAL_GUIDANCE (problem-first ilk 2 satır,
   "Hi my name is" yasak, ilandan ≥1 somut detay, portfolyo atfı, özgüllük>cila); `platforms.ts` guidance
   (LinkedIn ilk-80-karakter + About ilk 2 cümle; Upwork overview ilk 2 satır müşteri-sonucu; Fiverr
   keyword önde); `adapt.ts`/`profile-analyze.ts` skor kriterlerine keyword-hizalama + özgüllük.
2. **CV/ATS** (`lib/cv/ats.ts`+`keywords.ts`): birebir iş unvanı kontrolü, XYZ/rakamsız-bullet bayrağı,
   %60-80 keyword bandı; efsane-mesajı sızıntı testi.
3. **Takip kadansı** (`lib/followup.ts`+`lib/jobs/reminder.ts`): 1. takip 5-7 iş günü, 2. takip +7-10 gün,
   3. takip önerilmez — banner metni ve mantık hizalanır.
4. **Mülakat Prep modülü (YENİ):** `lib/interview/` saf çekirdek + `/api/interview/prep` (kredili AI) +
   job-detail-panel'de "interview" durumunda CTA. İçerik: STAR hikâye bankası (`profiles.projects`'ten),
   "tell me about yourself" (Present→Past→Future, 150-200 kelime), zayıflık-cevabı (ilan must-have'lerini
   dışlar), 4-5 soru-öner, mülakat sonrası 24 saat teşekkür-notu hatırlatması (reminder deseni reuse).
5. **Pipeline benchmark bantları** (`pipeline-stats.tsx`): yanıt %5-20, haftalık 10-30 başvuru, mülakat
   dönüşümü — "gayriresmî sektör aralığı" etiketiyle.
6. **"Referred by" alanı:** `job_listings` migration + job-add-modal + pipeline istatistiği.
7. **Rehberler** (`lib/guides/content.ts` + i18n): cover letter gerçeği, ATS efsaneleri vs gerçekler,
   takip zamanlaması, mülakat hazırlığı (STAR), Upwork teklif anatomisi — 🔴 istatistikler hariç.

### Faz 4 — DURUM (2026-07-14, Opus): TAMAMLANDI (4/4) + büyük özellik
Kullanıcı hepsini + "büyük yeni özellik" istedi. Yapıldı, hepsi push'lu, build temiz:
- ✅ **Özgüllük skoru**: `assessProposal`'a opsiyonel JD + `notSpecific` (ilandan somut terim).
- ✅ **Profil güç paneli**: `lib/profile/optimization.ts` (deterministik checklist) + profil sekmesi sidebar.
- ✅ **AI cover letter**: `lib/ai/coverletter.ts` + `/api/coverletter` + modal + job-detail CTA.
- ✅ **Uzantıda canlı skor**: `quickJobMatch` + `/api/match/quick` (ücretsiz) + uzantı v0.2.18.
- ✅ **BÜYÜK: AI Sahte Mülakat** (interaktif): `lib/ai/mock-interview.ts` + `/api/interview/mock/{start,feedback}`
  + `/dashboard/interview` + nav. Kullanıcı cevap yazar → AI puan + güçlü/gelişim + profilden model cevap.
- YAPILMADI (kasıtlı): auto-apply/auto-submit (kanıtlı ban riski).

### Faz 4 — orijinal detay (rakip boşluğu özellikleri)
1. AI cover letter (proposal motorunun `cover_letter` modu).
2. Teklif/başvuru özgüllük skoru (`lib/ai/coverage.ts` yanına saf specificity kontrolü).
3. Uzantıda canlı eşleşme skoru (mevcut skor motoru + `detectJobPage` reuse).
4. Upwork/Fiverr profil optimizasyon checklist-skoru (playbook kurallarından deterministik saf skor).
- **YAPMA:** auto-apply/auto-submit; ham AI çıktısını final diye sunma; tek-platform konumlanması.

## Sıralama ve doğrulama
- Faz 1 ile Faz 3 birbirinden bağımsız (paralel olabilir); Faz 2 orta; Faz 4 en son.
- Her fazda `npm run check` temiz; scrape kaynakları normalize birim testli + lokal `runScrape` kuru koşusu;
  UI değişiklikleri `npm run dev` ile elden doğrulanır.
- Yeni migration'lar mevcut desenle (RLS zorunlu); yeni env → `.env.example` + Vercel notu.
