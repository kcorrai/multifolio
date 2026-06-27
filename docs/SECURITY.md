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

## XSS / portfolyo HTML
- Portfolyo siteleri kullanıcı/AI üretimi HTML içerebilir. `lib/sanitize.ts` (`sanitizeHtml`)
  ile **render öncesi** dar bir allowlist'e indirgenir; script/inline-event/tehlikeli URL şemaları kaldırılır.

## Hata sızıntısı
- 5xx hatalarında iç mesaj/stack istemciye dönmez (`withErrorHandler`, `expose:false`).
