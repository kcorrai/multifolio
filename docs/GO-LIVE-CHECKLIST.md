# Yayına Çıkış Checklist'i — kullanıcının elle yapacakları

> 2026-07-04. Kod tarafı hazır; bu maddeler **senin hesaplarında** yapılır (Vercel, Supabase,
> cron-job.org, Resend, Sentry, Chrome Web Store). Prod domain: `https://multifolio-ecru.vercel.app`
> (email.ts'te sabit — kendi domainin farklıysa güncelle).

---

## 1. Migration push (0025–0026) — Supabase

0025 (`user_settings`) ve 0026 (`job_listings.status_changed_at`) prod'a gitmeyi bekliyor.
Her ikisi de **idempotent** (`if not exists` / `drop policy if exists`), bağımlılık sırası doğru
(`set_updated_at()` 0001'de tanımlı). Doğrulandı — güvenle push edilebilir.

```powershell
# Proje kökünde:
supabase db push
# (Linkli değilsen önce: supabase link --project-ref <PROJECT_REF>)
```

Push sonrası doğrula (Supabase SQL editöründe):
```sql
select 1 from information_schema.tables where table_name = 'user_settings';
select column_name from information_schema.columns
  where table_name = 'job_listings' and column_name = 'status_changed_at';
```

---

## 2. Cron kurulumu — cron-job.org (ücretsiz)

İki job, **aynı** secret'ı `x-cron-secret` header'ında gönderir (= Vercel'deki `SCRAPER_CRON_SECRET`).

### 2a. İlan çekme (scrape) — zaten kuruluysa atla
| Alan | Değer |
|------|-------|
| URL | `https://multifolio-ecru.vercel.app/api/internal/scrape` |
| Method | `POST` |
| Header | `x-cron-secret: <SCRAPER_CRON_SECRET değerin>` |
| Zamanlama | Günde ≤2 (ör. `0 6,18 * * *`) — Remotive ≤4/gün kuralına uyar |

### 2b. Haftalık özet e-postası (weekly digest) — ✅ KURULDU (2026-07-05, cron-job.org "Multifolio Weekly Digest", Pazartesi 09:00, successful/error yok)
| Alan | Değer |
|------|-------|
| URL | `https://multifolio-ecru.vercel.app/api/internal/weekly-digest` |
| Method | `POST` |
| Header | `x-cron-secret: <SCRAPER_CRON_SECRET ile AYNI değer>` |
| Zamanlama | Haftada 1 (ör. Pazartesi 08:00 → `0 8 * * 1`) |
| Body | (boş) |

**Doğrulama:** URL'i tarayıcıda GET ile aç → `{"ok":true,"hint":"POST with x-cron-secret..."}`
dönmeli (route GET'e hafif yanıt verir). Secret yanlış/eksikse POST 401 döner.
İlk tetiklemede `runWeeklyDigest` yalnız **sinyali olan** (son 7 gün aktivite/feed eşleşmesi olan)
kullanıcılara ve `user_settings.weekly_digest != false` olanlara e-posta atar.

> Not: cron-job.org kullanmak istemezsen alternatif `vercel.ts` `crons` alanı (Hobby'de günlük
> sınır var); cron-job.org daha esnek olduğu için tercih edildi.

---

## 3. Resend — auth e-postası blokajı (KRİTİK, giriş/kayıt patlıyor)

İki ayrı Resend kullanımı var, ikisi de **doğrulanmış domain** ister:
1. **Supabase Auth SMTP** (magic-link / şifre sıfırlama) — Supabase panelinde Custom SMTP.
2. **App bildirimleri** (`lib/notifications/email.ts`, Resend HTTP API) — env `RESEND_SMTP_PASS` (API key) + `RESEND_FROM_EMAIL`.

**Yapılacaklar:**
- [ ] Resend'de bir domain doğrula (DNS: SPF + DKIM kayıtları). `onboarding@resend.dev` yalnız
      kendi hesabının adresine gönderir — gerçek kullanıcıya gitmez.
- [ ] Supabase → Auth → SMTP Settings: doğrulanmış domaindeki `from` adresini gir.
- [ ] Vercel env: `RESEND_FROM_EMAIL="Multifolio <no-reply@senin-domainin>"` + `RESEND_SMTP_PASS=<resend-api-key>`.
- [ ] Test: **var olan** bir kullanıcıyla şifre sıfırlama iste (var olmayan e-posta enumeration
      koruması yüzünden 200 döner ama mail GÖNDERMEZ — SMTP'yi test etmez).

Ayrıca Supabase Auth manuel ayarı (kodda değil):
- [ ] "Confirm email" **KAPALI** (Management API: `PATCH /v1/projects/{ref}/config/auth` body `{"mailer_autoconfirm":true}`).
- [ ] Redirect URLs'e ekle: `/auth/verify-email` + `/reset-password` (hem localhost hem prod).

---

## 4. Sentry — source map upload — ✅ LOKAL DOĞRULANDI (2026-07-05)

- [x] Sentry projesi açıldı (`multifolio`/`javascript-nextjs`, EU/`.de.` veri bölgesi). DSN + `.env.local`'a girildi.
- [x] Personal token (Release:Admin + Project:R&W + Org:Read) üretildi → `SENTRY_AUTH_TOKEN`.
- [x] `CI=1 npm run build` → source map upload çalıştı (release `394f10c...`, artifact bundle + debug id'ler yüklendi).
- [x] 4 env Vercel prod'a eklendi (`vercel env add ... production`, hepsi Encrypted — doğrulandı 2026-07-05).
      Bir sonraki deploy'da devreye girer. **SENTRY TAMAMEN BİTTİ.**

---

## 5. Vercel env değişkenleri — tam liste

Prod'da tanımlı olmalı (`.env.example` referans; **güncellendi**):

| Değişken | Gizli? | Not |
|----------|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | hayır | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | hayır | RLS güvenli kılar |
| `SUPABASE_SERVICE_ROLE_KEY` | **evet** | asla istemciye |
| `OPENAI_API_KEY` | **evet** | uyarlama motoru (gpt-4o-mini) |
| `SCRAPER_CRON_SECRET` | **evet** | scrape + weekly-digest cron'u korur |
| `RESEND_SMTP_PASS` | **evet** | Resend API key (app bildirimleri) |
| `RESEND_FROM_EMAIL` | hayır | doğrulanmış domain adresi |
| `ANALYZE_IP_SALT` | **evet** | boşsa service-role'den türer; ayrı değer öner |
| `NEXT_PUBLIC_SENTRY_DSN` | hayır | boşsa Sentry no-op |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | evet/-/- | source map |

---

## 6. Chrome Web Store — uzantı yayını — ✅ YAYINDA (2026-07-06)

- [x] `cd extension && npm run build` → `npm run package` (store zip) + dashboard'a yüklendi.
- [x] Gizlilik sayfası URL'i: `https://multifolio-ecru.vercel.app/extension/privacy` (hazır).
- [x] İzin gerekçeleri girildi (cookie'li fetch — `docs/EXTENSION.md`).
- [x] **Google onayladı — canlı.** Mağaza URL'i: `https://chromewebstore.google.com/detail/iccpbihjghfekoodcjpddcnfbnnilpbp`
      (uzantı ID `iccpbihjghfekoodcjpddcnfbnnilpbp`; sabit `lib/extension.ts` `EXTENSION_STORE_URL`).
- [x] Uygulama içi "Uzantıyı yükle" CTA'ları bağlandı: platform detay (Upwork/Fiverr boş durumu) + `/extension/privacy`.

---

## 7. Yasal metinler (ödeme öncesi)

- [ ] `[Şirket Ünvanı] / [Adres] / [VKN]` yer tutucularını doldur (privacy/terms/kvkk).
      → Bilgileri paylaşırsan Claude bunları i18n kataloğunda doldurabilir.
- [ ] Metinleri bir hukukçuya inceletmeden ödeme (Iyzico) açma — şu an taslak.

---

## Durum özeti
- ✅ Kod: iki denetim backlog'u tükendi; migration'lar push'a hazır; header-auth E2E doğrulandı.
- ⏳ Sen: yukarıdaki 7 madde (hesap/DNS/hukuk gerektiren, kod dışı).
- ⏭️ Sırada (kod): Iyzico ödeme, Tier 2 kalan (hesap sağlığı taraması).
