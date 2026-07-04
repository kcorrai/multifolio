# Dashboard — UX / Tasarım / Ürün Denetim Backlog'u

> 3. göz denetimi — 2026-07-04. Gerçek test hesabıyla canlı gezinme (signup → onboarding
> import → overview → profile → platforms hub+detail → **adapt (1 kredi harcandı)** →
> jobs feed+detay → mobil) + kod çapraz kontrolü. Landing denetimi için bkz.
> `UX-REVIEW-BACKLOG.md`. Her madde: **ne / nerede / kabul kriteri**.

## Güçlü yönler (koru)
- **Onboarding import akışı** (metin → AI taslak → düzenle → kaydet) pürüzsüz; AI başlık/özet/
  beceri çıkarımı UI diline (TR) uygun ve kaliteli.
- **Profil sekmesi** — kimlik hero'su (avatar+headline+tamamlanma halkası) + çekirdek form +
  beceri çipleri + AI öneri paneli; iyi tasarlanmış.
- **Uyarla (adapt) çekirdek değeri çalışıyor** — LinkedIn'e optimize TR metin üretti, kredi
  100→99 doğru düştü, kopyala + "Yenile" var. Çıktı kalitesi iyi.
- **Platform HUB + detay** (4-bölüm: uyarla/bağlantı/işler/teklifler) temiz.
- **Mobil dashboard nav'ı çalışıyor** (yatay kaydırılabilir sekmeler) — landing header'ının
  aksine. (Not: mobil nav sorunu yalnız pazarlama header'ında.)

## P0 — Kritik (ilk izlenimi ve çekirdek vaadi kırıyor)

- [ ] **Feed alaka + içerik uyumsuzluğu — "mükemmel uyum" vaadi çöküyor**
  - Gözlem: "Senior Frontend Developer (React/Next.js)" profiliyle varsayılan **"Tüm eşleşen"**
    feed'i tamamen alakasız işlerle dolu — motor test mühendisi, üretim müdürü, dondurulmuş
    gıda satış direktörü, montaj teknisyeni. Hepsi **Arbeitnow Alman tam-zamanlı "(m/w/d)"**
    ilanları; ilan detayı açıklaması **Almanca** ("Çevriliyor..." on-demand çeviri).
  - Sorun: (a) varsayılan feed profil bazlı sıralama/filtre yapmıyor — yeni kullanıcı ham
    havuzu görüyor. (b) Havuz, ürünün **freelance** (Upwork/Fiverr/Bionluk/Armut) konumlandırmasına
    ve TR kitlesine ters (Alman on-site istihdam ilanları). Landing "İş ilanlarına mükemmel
    uyumu anında gör" diyor; kullanıcının gördüğü ise motor montaj ilanları.
  - Nerede: `app/api/feed`, `components/dashboard/jobs/feed-view.tsx`, scrape kaynakları
    (`lib/scrape/sources/{remotive,arbeitnow,remoteok}.ts` — job_pool içeriği).
  - Kabul: varsayılan feed profil beceri/başlığına göre en azından kaba sıralanır; havuz
    freelance/remote yazılım-tasarım ağırlıklı hale getirilir veya alakasızlar elenir.

- [ ] **Alakasız işe "uyum" öğrenmek için 1 kredi harcatıyor**
  - Nerede: ilan slide-over "Uyumu analiz et (1 kredi)" (`pool-job-panel.tsx`, `/api/feed/[poolId]/score`).
  - Sorun: feed relevance olmadan kullanıcı bariz uymayan işlerde skorlamaya kredi yakar.
  - Kabul: ücretsiz/ucuz ön-eleme (profil-skill kesişimi) skorlamadan önce çalışır; ya da
    açıkça uymayan ilanlarda skor butonu pasif/uyarılı.

- [ ] **İki çelişkili "profil tamamlanma" metriği**
  - Gözlem: Genel Bakış **"Profil gücü %38" (KIRMIZI bar)**; Profil sekmesi **"Tamamlanma %100"**
    (4 yeşil tik). Aynı profil, iki ekran, çelişkili sinyal.
  - Kök: `lib/profile-strength.ts` = 8 eşit maddeli (headline/summary/skills/avatar/portfolio/
    platformConnected/platformDataFetched/adapted) → 3/8 ≈ %38. Profil sekmesi ring'i yalnız
    4 çekirdek alanı sayıyor → %100.
  - Kabul: iki metrik birleştirilir VEYA etiket/anlam netçe ayrılır (ör. "Çekirdek profil %100"
    vs "Kurulum ilerlemesi %38"); yeni kullanıcı çelişki görmez.

## P1 — Orta

- [ ] **Profil gücünde yapısal tavan — manuel kullanıcı asla %100 olamaz**
  - Nerede: `lib/profile-strength.ts` — `avatar` + `portfolio` maddeleri yalnız içe aktarmadan
    (pratikte Bionluk) doluyor. Metinle/manuel giren kullanıcı bu 2 maddeyi hiç dolduramaz →
    kalıcı kırmızı/eksik görür. Üstelik **portfolyo UI'si kaldırılmış** olduğu halde skorda
    cezalandırıyor.
  - Kabul: manuel avatar yükleme eklenir VEYA bu maddeler manuel kullanıcı için opsiyonel/
    ağırlıksız sayılır; ulaşılamaz tavan kalkar.

- [ ] **Uyarlama çıktı dili UI diline sabit (global platformlarda sorun olabilir)**
  - Nerede: `lib/ai/adapt.ts` + `lib/ai/language.ts` — LinkedIn/Upwork/Fiverr için de TR çıktı.
  - Sorun: global müşteri hedefleyen kullanıcı EN profil ister. Teklifte platform dili var
    (`PLATFORM_LANGUAGE`) ama uyarlamada yok — tutarsız.
  - Kabul: uyarlamada da platform dili/dil seçimi (EN/TR toggle) uygulanır.

- [ ] **Ham event etiketi kullanıcıya sızıyor**
  - Nerede: Genel Bakış tür-bazlı kullanım kartı — "profile_import" çevrilmeden gösteriliyor
    (`components/dashboard/overview-tab.tsx`).
  - Kabul: event kind'lar i18n ile insan-okur etikete çevrilir ("Profil içe aktarma").

- [ ] **Onboarding sonrası "şimdi ne yapayım" yönü zayıf**
  - Gözlem: profil kaydedilince Genel Bakış'a düşüyor; checklist var ama net "sıradaki adım"
    akışı (feed'e git / ilk uyarlamanı yap) belirgin değil. Boş hesapta 30-gün grafik /
    başvuru performansı bölümleri de boş.
  - Kabul: onboarding sonrası birincil sonraki-adım CTA'sı; boş durumlar anlamlı placeholder.

## P2 — Küçük / cila

- [ ] Mobilde dashboard içeriğinde **yatay kaydırma çubuğu** görünüyor (küçük taşma).
- [ ] İlan başlıkları çevriliyor ama **"(m/w/d)"** Alman artefaktı kalıyor (`lib/ai/translate.ts`).
- [ ] Platform detayda **"Uyarla" CTA'sı iki kez** tekrarlanıyor (başlık + boş durum kutusu).
- [ ] **E-posta doğrula banner'ı her sekmede** tekrar görünüyor — kapat/ertele yok gibi;
  kalıcı tekrar rahatsız edici olabilir.
- [ ] Referral/davet linki dev'de `http://localhost:3000/...` gösteriyor (prod'da doğru olmalı — env kontrolü).
