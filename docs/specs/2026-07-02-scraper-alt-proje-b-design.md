# Alt-proje B — Canlı İlan Çekme (Scraper Worker) — Tasarım Taslağı

**Durum:** TASLAK — kullanıcı onayı bekliyor (2 karnın forku aşağıda "Açık kararlar"da).
**Tarih:** 2026-07-02
**Kapsam:** `job_pool`'a canlı `source='upwork'` ilanları yazan çekme katmanı. Dashboard (Alt-proje A) değişmez.

---

## 1. Neden bu tasarım — uphunt.io araştırması

uphunt'ın pazarlama blogu bilerek muğlak ("sub-minute cadence ile Upwork'ü izleyen yönetilen katman");
**gerçek mekanizma privacy policy'de sızıyor**, çünkü orada yasal olarak spesifik olmak zorundalar.
İki mekanizmayı kasıtlı karıştırıyorlar:

1. **İlan çekme (bizim Alt-proje B).** Privacy policy: *"publicly available job postings from Upwork
   and LinkedIn"* topluyorlar — yani public ilan sayfalarını **scrape** ediyorlar. Kanıt: subprocessor
   listesinde **GoLogin** (antidetect browser / yönetilen hesap altyapısı). GoLogin'e yalnızca bot-tespitini
   aşmak için gerçek tarayıcı oturumu sürdürüyorsan para ödersin. O kadar çok çekmişler ki **3.5M ilanlık
   dataset**'i ayrı ürün olarak satıyorlar. Depolama **MongoDB + Redis**, skorlama **OpenAI + Anthropic**.

2. **Auto-apply (ayrı, scraping DEĞİL).** Upwork'ün resmi **Agency Plus** özelliğiyle: profilin ajans üyesi
   olarak eklenir, teklif meşru ajans panelinden gönderilir. "No bots, no scrapers" iddiası **bu adım için**
   doğru — çekme için değil. Rahatlatıcı cümle auto-apply'a ait, çekme sessizce bir scraper.

**Çıkarım:** "Scraper kısmı"nın dürüst tarifi → *antidetect headless browser + (büyük olasılıkla) residential
proxy, Upwork public arama sayfasını sık aralıkla polling, ilan id'siyle dedup, havuza yaz, sonra AI skorla.*
Bu bizim mevcut `job_pool`'a birebir oturuyor (`source`/`external_id`/`raw` alanları + service-role-only yazım
zaten var; spec §13 devir kontratı: Alt-proje B yalnız `source='upwork'` satırları upsert eder).

## 2. Zorlayıcı gerçek (mimariyi belirleyen kısıt)

Upwork'ün **kullanılabilir public iş-arama API'si yok** (API partner-gated; agency özelliği başvuru içindir,
arama değil). Public arama sayfaları Cloudflare + datacenter-IP bloklama + JS render arkasında. **uphunt'ın
GoLogin + proxy ödemesinin sebebi tam bu.** Bizim yığın **Vercel serverless = datacenter IP**, Upwork hızla
bloklar. Dolayısıyla scraper **Next.js/Vercel app içinde çalışamaz** — ya 3. parti scraping servisi ya da
ayrı worker host gerekir.

## 3. Açık kararlar (kullanıcı onayı bekliyor — önerilen varsayılanlar işaretli)

- **K1 — Çekme yöntemi:** ✅ *önerilen* **3. parti scraping API** (ör. Apify Upwork actor / BrightData /
  ScraperAPI). Servis proxy+antidetect'i üstlenir; Vercel Cron sadece API'yi çağırıp normalize eder ve
  `job_pool`'a upsert eder. En az ops, "platformu basitleştir" ilkesine uyar, sonuç başına ücret.
  Alternatifler: (B) kendi antidetect scraper'ımız (ayrı host + residential proxy — uphunt yolu, ağır ops,
  Vercel'de çalışmaz), (C) hafif/legit kaynaklar önce (Upwork'ü atla).
- **K2 — Platform kapsamı:** ✅ *önerilen* **Sadece Upwork** ilk sürümde (pool şeması hazır, tek sağlam kaynak,
  devir kontratı `source='upwork'`). Sonra LinkedIn/TR platformları aynı adaptör arayüzüyle eklenir.

> Bu iki karar netleşince implementasyon planına geçilir. Her ikisi de kullanıcının sağlaması gereken
> **sır/bütçe** gerektirir (scraping API anahtarı + aylık maliyet iştahı) — bu yüzden kod öncesi onay şart.

## 4. Mimari (K1=3.parti API, K2=Upwork varsayımıyla)

```
Vercel Cron (schedule) ──► /api/internal/scrape/upwork  (service-role, korumalı)
        │                         │
        │                         ├─ ScrapeSource adaptörü (Upwork): scraping API'yi çağır
        │                         ├─ normalize(): API cevabı → PoolJobRow ({source,external_id,title,...,raw})
        │                         ├─ dedup + upsert: job_pool (unique(source,external_id)) service-role
        │                         └─ usage_events kind='scrape' (adet + maliyet log)
        ▼
   job_pool  ◄── Dashboard (Alt-proje A) okur (DEĞİŞMEZ)
```

- **Adaptör arayüzü** (pluggable): `interface ScrapeSource { id: 'upwork'|'linkedin'|...; fetch(params): Promise<RawJob[]>; normalize(raw): PoolJobRow }`. LinkedIn/TR sonra aynı arayüzle eklenir.
- **Tetikleyici:** Vercel Cron (`vercel.ts` crons veya route). Sık aralık maliyet-duyarlı: başlangıçta 15–30 dk;
  "sub-minute" hedefi sonra, maliyet netleşince.
- **Yetki:** internal route yalnız service-role/secret ile çağrılır (cron header doğrulama); kullanıcıya açık değil.

## 5. Veri akışı & dedup
- Her çekimde ilanlar `unique(source, external_id)` ile upsert — tekrar eden ilan güncellenir, çoğalmaz.
- `external_id` = Upwork ilan id'si (API/URL'den). `raw` = ham cevap (ileride yeniden normalize için).
- `posted_at` API'den; yoksa null (dashboard `nulls last` sıralar).
- Seed satırları (`source='sample'`) prod'da temizlenir: `delete from job_pool where source='sample'`.

## 6. Hata & maliyet görünürlüğü (sert kural 1)
- Route `withErrorHandler`'dan geçer; scraping API hataları Sentry'ye, iç detay sızmaz.
- Kısmi başarı: N ilandan biri normalize edilemezse o ilan atlanır + loglanır, batch patlamaz.
- Maliyet loglama: `usage_events` **kullanıcı-bazlı** (`user_id` zorunlu, RLS select-own) → sistem-geneli scrape
  run'ı oraya oturmaz. Öneri: hafif `scrape_runs` tablosu (kaynak, çekilen/yeni/atlanan adet, süre, maliyet)
  ya da ilk sürümde sadece Sentry/console log. Kredi düşmez (sistem gideri).
- Rate/quota: scraping API kotası aşılırsa route erken çıkar + uyarı loglar (sessiz truncation YOK).

## 7. Güvenlik (sert kural 2)
- Scraping API anahtarı yalnız sunucu + `.env` (`SCRAPER_API_KEY`, `SCRAPER_CRON_SECRET`). Asla commit/istemci.
- `job_pool` yazımı yalnız service-role (`lib/supabase/admin.ts`), route içinde; istemciye import yok.
- Dış cevap Zod ile doğrulanır (normalize öncesi şema kontrolü).

## 8. Test
- `normalize()` saf fonksiyon → birim test (örnek ham cevap → beklenen PoolJobRow).
- Adaptör `fetch()` mock'lanır (gerçek API çağrısı testte yok).
- Dedup: aynı `external_id` iki kez → tek satır (integration-ish, mock Supabase).

## 9. Env değişkenleri (yeni)
- `SCRAPER_API_KEY` — seçilen scraping servisinin anahtarı.
- `SCRAPER_CRON_SECRET` — cron route doğrulama sırrı.
- (opsiyonel) `SCRAPER_UPWORK_QUERY` / feed-türetimli sorgu stratejisi — sonra.

## 10. YAGNI / kapsam dışı (ilk sürüm)
- Auto-apply (uphunt'ın Agency Plus'ı) — AYRI, çok sonra; bu spec sadece çekme.
- Sub-minute cadence — önce 15–30 dk, maliyet kanıtı sonra.
- LinkedIn/TR platform adaptörleri — arayüz hazır, implementasyon sonra.
- Kendi proxy/antidetect altyapısı — K1=A ise hiç.

## 11. Devir/uyum
- Alt-proje A dashboard'u sıfır değişiklikle canlıya geçer (kontrat: `job_pool` upsert).
- `job_pool` mevcut; upsert için migration gerekmez. Tek olası migration: run loglaması için `scrape_runs`
  tablosu (isteğe bağlı — ilk sürüm Sentry log ile de gidebilir). `usage_events.kind` serbest text (doğrulandı,
  0002) ama tablo per-user olduğu için scrape run'ına uygun değil — §6'ya bakın.
