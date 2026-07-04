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

## P0 — Kritik (ilk izlenimi ve çekirdek vaadi kırıyor) — ✅ TAMAMLANDI (2026-07-04, commit `916401c`)

- [x] **Feed alaka** → `lib/feed/relevance.ts` (saf skill-kesişim motoru) varsayılan feed'i relevance DESC sıralar + düşük alakalıyı gizler; Arbeitnow scrape'ten düştü + havuzdan temizlendi; Remotive category=software-dev+design. E2E: React profili motor/üretim çöpü görmüyor (germanJunk 0).
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

- [x] **Alakasız işe kredi harcatma** → pool-job-panel'de ücretsiz relevance rozeti + düşük-alaka (<20) skorlamada iki-adımlı uyarı ("yine de analiz et?"); hard-block yok.

- [x] **İki çelişkili tamamlanma metriği** → `profile-strength.ts` 6-çekirdek (ulaşılabilir) + 2-bonus (avatar/portfolyo %'ye girmez → manuel kullanıcı %100 olabilir, tavan kalktı); Overview "Kurulum ilerlemesi" vs Profil "Çekirdek profil" relabel (çelişki bitti). NOT: P1 "yapısal tavan" da bu değişiklikle kapandı.

## P1 — Orta

- [x] **Profil gücünde yapısal tavan** → ✅ P0-3 ile kapandı: avatar/portfolyo artık opsiyonel bonus (yüzdeye girmez); manuel kullanıcı çekirdek döngüyle %100 olur.

- [x] **Uyarlama çıktı dili → PLATFORM dili** (2026-07-04, `01fa26b`): `adaptProfile` artık `PLATFORM_LANGUAGE[platformId]` kullanır (upwork/fiverr/linkedin=EN, bionluk/armut=TR) — teklifteki desen. `locale` param kaldırıldı.

- [x] **Ham event etiketi** (2026-07-04, `01fa26b`): profile_import/platform_sync/public_analyze i18n `analytics.kind`'a eklendi.

- [ ] **Onboarding sonrası "şimdi ne yapayım" yönü zayıf**
  - Gözlem: profil kaydedilince Genel Bakış'a düşüyor; checklist var ama net "sıradaki adım"
    akışı (feed'e git / ilk uyarlamanı yap) belirgin değil. Boş hesapta 30-gün grafik /
    başvuru performansı bölümleri de boş.
  - Kabul: onboarding sonrası birincil sonraki-adım CTA'sı; boş durumlar anlamlı placeholder.

## P2 — Küçük / cila

- [x] Mobilde **yatay taşma** → içerik kabına `overflow-x-clip` (2026-07-04, `4954908`).
- [~] İlan başlıklarında **"(m/w/d)"** artefaktı — Arbeitnow düştüğü için yeni ilanlarda büyük ölçüde kalktı (kaynak Alman'dı).
- [x] Platform detay **çift "Uyarla" CTA'sı** → boş-durumdaki tekrar kaldırıldı (2026-07-04, `f54bb61`).
- [x] **E-posta doğrula banner'ı** → kapat (X) eklendi, oturum boyunca gizli (2026-07-04, `f54bb61`).
- [x] Referral localhost → NON-ISSUE: `window.location.origin` prod'da doğru domain (reviewer dev'de gördü).
