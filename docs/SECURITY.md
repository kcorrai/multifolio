# Security

> Sütun 2: güvenli-by-default. İstemci verisine güvenilmez.

## Girdi doğrulama (Zod)
- Her dış girdi (gövde/query/params) `lib/validation` üzerinden bir Zod şemasından geçer.
  `parseJson` / `parseQuery` başarısızlıkta `ValidationError`(400) fırlatır.
- Şemalar `lib/validation/schemas/` altında toplanır (ör. `profile.ts`).

## Sırlar
- Tüm sırlar yalnızca `.env.local`'da; **asla commit edilmez** (`.gitignore`: `.env*`,
  istisna `.env.example`). Şablon: `.env.example`.
- `NEXT_PUBLIC_*` tarayıcıya gider — yalnızca güvenli public değerler (Supabase URL/ANON, Sentry DSN).
- `SUPABASE_SERVICE_ROLE_KEY` ve `ANTHROPIC_API_KEY` GİZLİ; yalnızca sunucu kodu. AI çağrıları
  asla istemciden yapılmaz.

## Veritabanı (RLS)
- Her tabloda RLS **açık**; politikalar veriyi sahibiyle sınırlar (`auth.uid() = user_id`).
  Bkz. `supabase/migrations/0001_init.sql`.
- Varsayılan erişim RLS'li client (`lib/supabase/server.ts`). `admin.ts` (service-role) RLS'i
  bypass eder → yalnızca gerçek admin işleri, asla istemciye import edilmez (`server-only`).
- Sorgular Supabase client ile parametreli; ham SQL string birleştirme yapılmaz.

## XSS / portfolyo içeriği
- **Mevcut durum:** portfolyo içeriği ham HTML DEĞİL, yapılandırılmış JSON (`PortfolioContent`).
  `/p/[slug]` bunu React text-node olarak render eder → otomatik escape. Kullanıcı/AI metni
  hiçbir yerde `dangerouslySetInnerHTML` ile basılmaz; repodaki iki kullanımı da JSON-LD
  script'idir (`<` escape'li).
- `lib/sanitize.ts` (`sanitizeHtml`) DURUYOR ama şu an **hiçbir yerden çağrılmıyor** — ileride
  ham HTML kabul eden bir alan (zengin metin bio, gömülü blok) eklenirse render öncesi
  ZORUNLU geçiş noktasıdır. Böyle bir alan eklenmeden "sanitize var" varsayımıyla hareket etme.
- Gömülü medya ayrı korunur: `lib/portfolio/embed.ts` rastgele iframe src'ye ASLA izin vermez,
  yalnız allowlist host (YouTube/Vimeo/Loom/Figma) → sabit embed URL'i üretir.

## Hata sızıntısı
- 5xx hatalarında iç mesaj/stack istemciye dönmez (`withErrorHandler`, `expose:false`).
