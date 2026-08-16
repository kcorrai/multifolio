# Tasarım dili — Solar Pop

Multifolio'nun görsel dili **Solar Pop**'tur (Claude Design'da üretildi, 2026-08-15).
Sıcak krem zemin, tek düz renk katmanları, alev turuncusu + sakız pembesi, ağır
büyük-harf display tipografi ve tek el yazısı vurgu kelimesi. **Gradient yok, doku
yok, KOYU TEMA YOK.**

> **Yeni bir şey eklerken kural:** yeni her yüzey bu dille yazılır. Önce
> `components/solar/*` parçalarını (Card, ScoreBlock, Bar, TextField, ToolShell,
> SolarHeader/Footer) kullan; olmayanı `app/solar-pop.css` token'larıyla kur.
> Yeni renk/ölçü uydurma — token yoksa önce token ekle.

## Kaynak

Claude Design projesi `7cf067ab-b1a4-46bb-9242-18e57e1c3f1d`, design system
`_ds/solar-pop-studio-design-system-db422856-5654-4f64-903b-cf7cec080615`.

Beş komp üretildi; hepsi `DesignSync` MCP'siyle yeniden çekilebilir:

| Komp | Durum |
| --- | --- |
| `Multifolio Free Tools - Solar Pop` | **Uygulandı** — 6 ücretsiz araç sayfası |
| `Multifolio Landing - Solar Pop` | **Uygulandı** — `app/page.tsx` |
| `Multifolio Auth - Solar Pop` | **Uygulandı** — login/signup/forgot/reset |
| `Multifolio Dashboard - Solar Pop` | **Uygulandı** — kabuk + token köprüsü |
| `Multifolio Portfolio Page - Solar Pop` | **Uygulandı** — preset yapısal eksenleri |

Yerel referans kopyaları: `docs/design/solar-pop/*.html`. Bunlar Claude Design'ın
`x-dc` çalışma zamanını kullanır — **çalıştırılabilir değildir, spec'tir**.

## Kodda nerede

- `app/solar-pop.css` — token bloğu (design system'den BİREBİR) + `.sp-*` sınıfları.
  **Token değerlerini elle değiştirme**; tasarım değişirse design projesinden çek.
- `app/globals.css` — shadcn semantik token'ları (`--background`, `--card`,
  `--primary` …) Solar Pop paletine bağlanır. `--font-sans` → Poppins. Bu köprü
  sayesinde `bg-card`/`text-muted-foreground` kullanan ESKİ ekranlar da ısınır.
- `app/layout.tsx` — Poppins (display+gövde) + Yellowtail (el yazısı) `next/font`.
- `components/solar/`
  - `primitives.tsx` — Blob, Card, CardHead, Label, Disc, ScoreBlock, BigNumber,
    Bar, Finding(sList), EmptyStance, ShareMark, StickyResult, TwoCol. Hook YOK →
    sunucu+client ortak.
  - `fields.tsx` — NumField, SliderField, TextField, TextAreaField.
  - `site-chrome.tsx` — Wordmark, SolarHeader, HeaderAuth, SolarFooter,
    SolarSection, SectionHeading. **Tüm public sayfaların tek başlık/footer'ı.**
  - `landing-nav.tsx` — masaüstü çapa linkleri + mobil hamburger/sheet.
  - `tool-shell.tsx` — ücretsiz araç sayfalarının kabuğu (hero + çapraz-link).
  - `use-reduced-motion.ts` — `useSyncExternalStore` ile hareket tercihi.
- `components/landing/solar/` — hero destesi, vitrin rayı, SSS akordeonu, bento.
- `components/auth/auth-layout.tsx` — "bilet" kompozisyonu (şerit + perforasyon +
  form) ve auth form parçaları.
- `components/dashboard/shell.tsx` — 248px gruplu kenar çubuğu + başlık şeridi.
- `lib/tools/catalog.ts` — araç kimliği/rota tek kaynağı.
- `lib/portfolio/theme.ts` — portfolyo preset'leri: renk + **yapısal eksenler**.

## Kurallar

- **Koyu tema yok.** `ThemeProvider` `forcedTheme="light"`; `.dark` bloğu nötr;
  tema seçici tüm yüzeylerden kaldırıldı. Geri istenirse tek yer ThemeProvider.
- **Bağlantı rengi `:where()` ile sıfır özgüllükte** tanımlıdır — yoksa
  `.sp-page a` buton sınıflarını yener ve `<a class="sp-btn">` görünmez olur.
- **Renk tek sinyal değildir**: skor/bulgu daima kelime + glif taşır.
- **Skor ölçeği ortaktır**: 60 ve 80'de çentik, her araçta aynı.
- **Odak halkası sarmalayıcıda** (`.sp-fieldwrap:focus-within`), input'ta değil.
- Metin daima i18n'de: kabuk `siteChrome.*`, araçlar `tools.*` + kendi
  namespace'inde `sp`, landing `landing.sp.*`, auth `auth.sp.*`, dashboard
  `dashboard.sp.*`.

## Portfolyo sayfası ayrı tutulur

`/p/[slug]` Multifolio markası TAŞIMAZ — sahibinin seçtiği preset+vurgu ile
render edilir. Solar Pop'un kremi/alevi oraya sızmaz.

Preset'ler artık yalnız renkte değil **ritimde** de ayrışır (`lib/portfolio/theme.ts`):
ölçü genişliği, bölüm aralığı, başlık ölçeği, köşe yarıçapı, görsel oranı, galeri
kolonu, hero hizası/kolonları, etiket biçimi, avatar yarıçapı.

| Preset | Ritim |
| --- | --- |
| studio | 1080px, ızgaralı, sans, 14px yarıçap, 3'lü galeri, sola hizalı |
| atelier | 760px, tek kolon ORTALI, serif başlık, 3px yarıçap, 2'li galeri |
| noir | 1140px, koyu, sıkı, 22px yarıçap, 16/10 görsel |

`/p/demo` tema değiştiricisi artık `?preset=` ile **sunucuya** gider — düzen
sunucuda hesaplandığı için istemcide CSS değişkeni yamamak yarım sayfa üretiyordu.

## Tasarımla gelen ürün değişiklikleri

Komplar yalnız görünüm değil duruş da getirdi. Uygulanırken şunlar değişti:

1. **Koyu tema kaldırıldı** (design system'de yok) — tema seçici de kaldırıldı.
2. **ATS denetleyicideki üyelik kilidi kaldırıldı.** Ücretsiz araçlar tamamen
   ücretsizdir; dönüşümü kabuğun çapraz-link paneli yapar. Tek kapı `/analyze`.
3. **`/analyze` teaser'ında bulanık sahte içerik katmanı kaldırıldı** — yerine
   "Not blurred — not sent" rozetli dürüst kilit kartı.
4. **Araç içi signup CTA'ları** tek panele toplandı; **TRY para birimi seçicisi**
   kaldırıldı (GLOBAL-ONLY); **mobil yapışkan sonuç çubuğu** eklendi.
5. **Landing'in Remotion videosu** yerini 6 adımlık interaktif vitrin rayına
   bıraktı (`components/landing/solar/showcase-rail.tsx`). `remotion/`,
   `showcase-video*.tsx`, `landing-motion.tsx`, `tilt.tsx` ve `remotion` /
   `@remotion/player` / `@remotion/cli` bağımlılıkları SİLİNDİ.
6. **Landing'den kayan yorum şeridi (TestimonialsSection) çıkarıldı** — komp'ta
   yok; bileşen ve `landing.testimonials` kataloğu SİLİNDİ. (Portfolyo tarafındaki
   müşteri yorumu özelliği — `testimonials` tablosu + `testimonials-manager` —
   ayrıdır, duruyor.)
7. **Portfolyo proje kartlarında SONUÇ öne alındı** (kanıt açıklamayı yener).
8. **Şifre sıfırlamada sessiz yönlendirme kaldırıldı** — süresi dolmuş token artık
   kartın tamamını değiştiren, yeniden link isteten bir ekran gösterir.
9. **Dashboard nav'ı gruplandı** (Work / Assets / Practice / Help) ve "Getting
   started" nav'a taşındı.

## Bilinen artıklar (sonraki tur)

- Dashboard iç sekmelerinde başarı/hata renkleri hâlâ Tailwind `emerald`/`red`
  (soğuk yeşil). Solar Pop "soğuk renk yok" diyor; anlam kaybı riski nedeniyle
  mekanik olarak değiştirilmedi.
  **2026-08-16 tespiti:** bu mekanik olarak KAPATILAMAZ — design system'de
  durum (ok/uyarı/hata) rengi hiç yok, yalnız flame/pink/cream/ink var. ~40
  dosyada 200+ eşleşme var; doğru sıra (a) design projesinden durum paleti
  çekmek ya da bilinçli bir karar olarak `--status-{ok,warn,danger}` token'ı
  eklemek, (b) `.sp-status--*` sınıflarını kurmak, (c) yüzeyleri tek tek
  geçirmek. Renk tek sinyal olmadığı için (kelime + glif zorunlu) mevcut
  durum işlevsel olarak DOĞRU, sadece dil dışı.
- `components/pricing-section.tsx` dışındaki bazı eski panellerde `rounded-2xl`
  gibi Tailwind yarıçapları kaldı; token'a bağlı olmadıkları için ritim birebir
  değil (yakın, ama komp'un 22/30px'i değil).
- ~~Öksüz i18n anahtarları~~ ✅ 2026-08-16 — `landing.{showcase,testimonials,
  platformsStrip,how,footer,mockup,demos,grow}` silindi. Statik grep bunu tek
  başına kesinleştiremiyordu (`getTranslations("landing")` ile kök namespace
  okuyan bileşenler var); e2e'nin `assertNoMissingMessages` ağı 60/60 yeşil
  verdikten sonra silindi. Kalan: `nav, cta, hero, toolCta, features, tools,
  pricing, faq, finalCta, sp`.
