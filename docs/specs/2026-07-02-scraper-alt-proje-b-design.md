# Alt-proje B — Canlı İlan Çekme (Ücretsiz Remote-İş API'leri) — Tasarım

**Durum:** ONAYLANDI (2026-07-02) — implementasyon planına hazır.
**Kapsam:** `job_pool`'a canlı ilan yazan ücretsiz çekme katmanı. Dashboard (Alt-proje A) DEĞİŞMEZ.
**Karar:** B yolu — ücretsiz remote-iş API'leri (Remotive + Arbeitnow). Upwork ertelendi (aşağıda §2).

---

## 1. Neden bu tasarım — uphunt.io araştırması (özet)

uphunt'ın pazarlama blogu bilerek muğlak; gerçek mekanizma **privacy policy'de** sızıyor. İki mekanizmayı
kasıtlı karıştırıyorlar: (1) **İlan çekme** = Upwork/LinkedIn public ilanlarını **antidetect browser** ile
scrape (subprocessor **GoLogin** = kanıt; 3.5M ilan dataset satıyorlar). (2) **Auto-apply** = ayrı, resmi
**Agency Plus** özelliği (scraping DEĞİL — "no bots" iddiası buradan). Depo MongoDB+Redis, skor OpenAI+Anthropic.

**Bizim için çıkarım:** Upwork'ü güvenilir çekmek antidetect browser + residential proxy = para ister (uphunt
bile ödüyor). Ücretsiz + güvenilir + Upwork pratikte yok. Bu yüzden ücretsiz, API-dostu, Cloudflare'siz
kaynaklardan başlıyoruz.

## 2. Zorlayıcı kısıt & Upwork'ün ertelenmesi

Upwork'ün kullanılabilir public iş-arama API'si yok; public sayfalar Cloudflare + datacenter-IP bloklama
arkasında. Bizim yığın **Vercel = datacenter IP** → Upwork bloklar. Bu yüzden Upwork ilk sürümde **kapsam
dışı**. Yerine ücretsiz JSON API sunan remote-iş panolarından çekiyoruz (düz `fetch`, proxy YOK, sıfır maliyet).
Upwork sonra ücretsiz-tier scraping API ile düşük frekansta tak-çıkar eklenebilir — adaptör arayüzü buna hazır.

**Dürüst uyarı:** bu kaynaklar çoğunlukla **remote full-time** iş içerir; freelance/contract alt kümedir
(Remotive'de `job_type=freelance` filtresiyle daraltılır). Upwork-tarzı gig havuzu birebir değil — bu adım
"canlı akışı ücretsiz ayağa kaldır + mimariyi kanıtla".

## 3. Kaynaklar (ilk sürüm) + kullanım koşulları

| Kaynak | API | Ücret | Kısıt / attribution |
|---|---|---|---|
| **Remotive** | `GET https://remotive.com/api/remote-jobs` (opsiyonel `?category=&search=&limit=`) | Ücretsiz JSON | **Günde ≤4 çekim**, kaynağa geri link + kredi zorunlu, 3. parti panolara re-post yasak. Biz `url` ile kaynağa yönlendirip UI'da "via Remotive" kredisi göstererek uyarız. |
| **Arbeitnow** | `GET https://www.arbeitnow.com/api/job-board-api` (sayfalı: `?page=`) | Ücretsiz açık JSON | Gevşek; kaynağa link ile uyulur. **Alan adları adaptör implementasyonunda gerçek cevapla doğrulanır.** |

RemoteOK ilk sürümde ATLANDI (bot-UA blokluyor → 403; ilk elemanda sıkı legal notice). Sonra Jobicy / Adzuna
(TR dahil ülke bazlı) eklenebilir.

## 4. Mimari

```
Ücretsiz cron (cron-job.org veya Vercel Cron) ──► POST /api/internal/scrape  (secret header korumalı)
     │
     ├─ SOURCES = [remotiveAdapter, arbeitnowAdapter]
     ├─ her adaptör: fetch() → RawJob[]  →  normalize(raw) → PoolJobUpsert parçası
     ├─ Zod ile dış cevap doğrulanır (normalize öncesi)
     ├─ dedup + upsert: job_pool  (onConflict source,external_id)  — service-role (admin.ts)
     └─ scrape_runs log (source, fetched, upserted, skipped, ms, error?) + Sentry
             ▼
        job_pool ◄── Dashboard (Alt-proje A) DEĞİŞMEDEN okur
```

**Adaptör arayüzü** (pluggable, saf-test-edilebilir):
```ts
interface ScrapeSource {
  id: string;                                    // 'remotive' | 'arbeitnow'
  fetch(): Promise<unknown[]>;                   // ham cevap (test'te mock'lanır)
  normalize(raw: unknown): PoolJobUpsert | null; // geçersizse null (atla)
}
```
`fetch()` (I/O) ve `normalize()` (saf) ayrı → normalize birim-testlenir, fetch mock'lanır.

## 5. Normalize eşlemesi → `PoolJobRow` (mevcut şema, `lib/validation/schemas/feed.ts`)

Ortak: `description` HTML olabilir → mevcut `htmlToText` (`lib/import/text.ts`) ile düz metne çevrilir.
`raw` = ham obje (ileride yeniden normalize için). `client_spent` = null (bu kaynaklarda yok).

**Remotive** (alanlar doğrulandı):
`source='remotive'` · `external_id=String(id)` · `title` · `description=htmlToText(description)` ·
`url` · `budget=salary||null` · `skills=tags??[]` · `client_country=candidate_required_location||null` ·
`posted_at=publication_date`.

**Arbeitnow** (beklenen; adaptörde doğrulanır):
`source='arbeitnow'` · `external_id=slug` · `title` · `description=htmlToText(description)` ·
`url` · `budget=null` · `skills=tags??[]` · `client_country=location||null` ·
`posted_at=created_at (unix→ISO)`.

## 6. Dedup & upsert
- `job_pool` üzerinde `upsert(..., { onConflict: 'source,external_id' })` — tekrar eden ilan güncellenir, çoğalmaz.
- Batch: geçersiz/normalize edilemeyen satır atlanır + `skipped++`, batch PATLAMAZ (kısmi başarı).
- Seed satırları (`source='sample'`) prod'da temizlenir: `delete from job_pool where source='sample'`.

## 7. Tetikleyici / frekans
- Route: `POST /api/internal/scrape` — `x-cron-secret` header'ı `SCRAPER_CRON_SECRET` ile eşleşmezse 401.
- Tetikleyici: **cron-job.org** (ücretsiz, Vercel plan sınırından bağımsız) günde 1–2 kez çağırır. Alternatif
  Vercel Cron (`vercel.json` crons) — Hobby'de günlük sınır var, cron-job.org daha esnek.
- Frekans günde ≤2 (Remotive'in ≤4/gün kuralına uyar; bu API'ler zaten kendi cache'liyor).

## 8. Hata & görünürlük (sert kural 1)
- Route `withErrorHandler`'dan geçer; dış API hataları Sentry'ye, iç detay istemciye sızmaz.
- **`scrape_runs` tablosu** (migration `0015`): her koşu için `source, fetched, upserted, skipped, error, ms,
  created_at`. Sessiz truncation YOK — kotaya takılırsa/atlarsa loglanır. Service-role yazar; admin görünürlük.
- Bir kaynak patlarsa diğer kaynak devam eder (`Promise.allSettled`).

## 9. Güvenlik (sert kural 2)
- Sırlar yalnız sunucu + `.env`: `SCRAPER_CRON_SECRET`. Dış API'ler anahtarsız (ücretsiz public).
- `job_pool`/`scrape_runs` yazımı yalnız service-role (`lib/supabase/admin.ts`), route içinde; istemciye import YOK.
- Dış cevap Zod ile doğrulanır (normalize öncesi şema kontrolü) — istemci/dış veriye güvenilmez.
- SSRF yok: çekilen `url` yalnız saklanır + UI'da link olur, sunucu o adrese İSTEK ATMAZ → ek url süzme gereksiz.

## 10. Test
- `normalize()` saf → birim test: örnek Remotive/Arbeitnow ham cevap → beklenen PoolJobUpsert (+ HTML→text,
  eksik alan → null/skip).
- Adaptör `fetch()` mock'lanır (testte gerçek ağ yok).
- Dedup: aynı `(source, external_id)` iki kez → tek satır (upsert davranışı).
- `npm run check` (lint+tsc+vitest) temiz olmalı.

## 11. Env değişkenleri (yeni)
- `SCRAPER_CRON_SECRET` — internal scrape route doğrulama sırrı. (`.env.example`'a eklenir.)

## 12. Migration
- **`0015_scrape_runs.sql`** — `scrape_runs` log tablosu (service-role yazar, RLS: authenticated select opsiyonel/kapalı).
- `job_pool` upsert için migration GEREKMEZ (0012/0013 yeterli).

## 13. YAGNI / kapsam dışı (ilk sürüm)
- Upwork / LinkedIn / TR platform çekme — adaptör arayüzü hazır, implementasyon sonra.
- Auto-apply (uphunt Agency Plus) — çok sonra, ayrı iş.
- Sub-minute cadence, otomatik toplu AI skorlama — YOK (skor on-demand kalır, kredi ekonomisi korunur).
- Kendi proxy/antidetect altyapısı — bu yolda hiç gerekmez.

## 14. Devir/uyum
- Alt-proje A dashboard'u SIFIR değişiklikle canlıya geçer (kontrat: `job_pool` upsert, `unique source+external_id`).
- `source='remotive'|'arbeitnow'` → `pool-job-row` platform rozeti bilinmeyen kaynak için nötr rozet göstermeli
  (kontrol edilecek: mevcut rozet map'i bilinmeyen source'ta patlamıyor mu → gerekirse fallback eklenir).
