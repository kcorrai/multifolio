# İlan Akışları Denetimi — feed oluştur / yıldızlı / ilan çevirisi

> 3. göz denetimi — 2026-07-04. 3. tur: önceki turlarda kapsanmayan ilan (Jobs) alt-akışları
> gerçek test hesabıyla canlı test edildi. Diğer denetimler: `UX-REVIEW-BACKLOG.md` (landing),
> `DASHBOARD-REVIEW-BACKLOG.md` (dashboard), `DEEP-REVIEW-BACKLOG.md` (teklif/arama/light/EN/a11y).
> **Not:** test sırasında dev ortamı aktif düzenleme altındaydı (fast-refresh + hesap değişimi),
> bu yüzden bazı çok-adımlı etkileşimler kesildi; ilgili yerlerde belirtildi.

## Bu turda DOĞRULANAN güçlü yönler

- [x] **İlan açıklaması çevirisi — mükemmel.** Almanca orijinal açıklama, UI diline (EN) akıcı
  çevrildi; markdown yapısı (**Tasks/Qualifications/Benefits**) korundu; **"Show original"**
  toggle ile orijinale dönülüyor. On-demand + paylaşımlı cache (`job_translations`). ✓
- [x] **Yıldızlama akışı çalışıyor.** Feed'de bir ilanı yıldızla → **Starred** sekmesinde dolu
  altın yıldızla görünüyor; feed'de de yıldız kalıcı. ✓
- [x] **Feed oluşturma modalı kapsamlı ve iyi etiketli.** Alanlar: Feed adı, Platform, Keywords
  (en az biri içermeli), Excluded keywords, Country filter, Min hourly/fixed (USD), Client min
  spent (USD), Minimum score slider, Email alerts. Keyword çip girişi (Enter/"+") düzgün.
  Dürüst not: client-spend filtresi mevcut kaynaklarda pasif olduğunu açıkça belirtiyor.

## P1 — Orta

- [x] **Feed default alaka + kalite, ilk sanılandan DAHA KÖTÜ** — KISMEN KAPANDI 2026-07-05
  - Gözlem: varsayılan **"All matched jobs" (25)** feed'i, aynı **"Tax Advisor (m/w/d) in
    [Alman şehri]"** ilanını ~10 farklı kasabada (Waghäusel, Budenheim, Grafing, Neubulach,
    Ratingen...) **tekrarlıyor** + Sales Director, Werkstudent minijob, Video Editor 17€/std.
    Ağır **duplikasyon** + yanlış pazar. Tek "Software Development" eşleşmesi bile (Embedded
    C/C++) **"Fluent in German (!!!) + Regularly in Kempten"** istiyor — remote frontend'e
    tamamen alakasız.
  - → `DASHBOARD-REVIEW-BACKLOG.md` P0'ını (feed alaka + havuz uyumsuzluğu) güçlendirir; ayrıca
    **duplikasyon eleme (dedup)** ihtiyacını ekler.
  - Kabul: havuz freelance/uygun pazar ağırlıklı; near-duplicate ilanlar (aynı başlık/şirket,
    farklı şehir) tekilleştirilir; varsayılan feed profile göre sıralanır.
  - Çözüm (alaka+pazar): Arbeitnow düşürüldü, Remotive/RemoteOK'ye geçildi (Alman on-site çöpü
    gitti — round4 doğruladı) + `lib/feed/relevance.ts` profile göre sıralama/gizleme.
  - Çözüm (dedup): near-duplicate eleme `lib/feed/relevance.ts` `dedupeNearDuplicates` ile
    varsayılan feed + arama görünümüne eklendi (aynı normalize başlık+şirket → tek ilan).

- [x] **Feed kaydetme hatasında kullanıcıya görünür geri bildirim yok (silent fail)** — KAPANDI 2026-07-05
  - Gözlem: "Save feed" → `POST /api/feeds` **401** döndü, modal **sessizce açık kaldı**,
    kalıcı hata/toast görünmedi. (401'in kendisi bu turdaki oturum churn'ünden olabilir — eş
    zamanlı dev aktivitesi hesabı değiştirdi — ama **başarısız kayıtta sessiz kalma UX'i** neden
    ne olursa olsun geçerli.)
  - Kabul: feed kaydı başarısızsa (401/ağ/validasyon) net bir hata mesajı/toast gösterilir;
    kullanıcı "kaydettim ama bir şey olmadı" durumunda kalmaz.
  - Çözüm: `feed-modal.tsx` `error` state + `!res.ok` → `setError(...)` + satır 186 görünür
    `text-destructive` mesajı; modal artık sessiz kapanmıyor.

## Doğrulanamayan (ortam kaynaklı)

- **Feed kaydının kalıcılığı** (yeni feed'in sol "Saved feeds" rayında görünmesi) — 401 +
  oturum churn nedeniyle tam doğrulanamadı. Modal UX'i tamamen görüldü; işlevsel doğrulama için
  stabil oturumla tekrar denenmeli.
- **Feed sayfa-içi ayar paneli** (`feed-settings-panel.tsx`: ön-filtre/AI skorlama/bildirim/
  **proposal_prompt** inline PATCH) — oluşturma modalında DEĞİL (tasarım gereği; kaydedilmiş
  feed seçilince açılıyor). Feed kaydı doğrulanamadığı için bu panel bu turda test edilemedi.

## Notlar
- `proposal_prompt` (feed'e özel teklif yönergesi) oluşturma modalında yok — bu doğru
  (CLAUDE.md: feed-modal yalnız OLUŞTURMA; düzenleme sayfa-içi panelde). Eksik değil.
