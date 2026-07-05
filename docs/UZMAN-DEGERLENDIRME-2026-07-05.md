# Multifolio — Uzman 3. Göz Değerlendirmesi

**Tarih:** 2026-07-05
**Kaynak:** Otomatik değerlendirme ajanı (canlı akış denemesi). Bir iddiası düzeltildi (aşağıdaki not).
**Yöntem:** Gerçek kullanıcı gibi kayıt → onboarding → gerçek public profil (`bionluk.com/esmasayinturk`, ürün/grafik tasarımcı) ile tüm akışlar denendi. Masaüstü + mobil, açık + koyu tema, TR + EN kontrol edildi.
**Test hesabı:** `test-degerlendirme@example.com` (geçici; birkaç AI aksiyonu denendi).

> **Düzeltme (2026-07-05):** Ajan "100 kredi ile başladı" demişti; o an kayıt aslında **0 kredi**
> veriyordu (bkz. bu oturumda düzeltilen T0.5 bug'ı — artık gerçekten 100 veriliyor). Aşağıdaki
> **P0-3 sahte testimonial** ZATEN bu oturumda gizlendi; **P0-2 KVKK/legal** ve **P1 oturumsuz CTA /
> signup onay kutusu / portfolyo CTA** ile **feed veri kalitesi (P0-1)** hâlâ açık — `docs/FEATURE-BACKLOG-2026-07-05.md` ile birlikte değerlendir.

Değerlendirici notu: Ürünün çekirdek "profil → çoklu platform" hattı **etkileyici derecede iyi** çalışıyor. Ana risk teknikte değil, **içerik/veri kalitesinde ve yayına-çıkış (legal/CTA) boşluklarında.** İş feed'i, ürünün en zayıf ve vaatle en çelişen parçası.

---

## ✅ İyi çalışan (koru)

- **Bionluk içe aktarma kusursuz:** Gerçek profilden başlık, özet, 6 beceri, avatar ve **5 portfolyo görseli** doğru çekildi. Emek→sıfır vaadini gerçekten tutuyor.
- **Platform uyarlaması güçlü:** Türkçe kaynaktan Upwork'e özel, akıcı **İngilizce** "Product & Graphic Designer" metni üretti. Platform dili doğru.
- **Portfolyo + public sayfa:** Şık, profesyonel, gerçek avatar+galeri ile. 3 tema (Studio/Atelier/Noir) + vurgu rengi seçimi canlı önizlemeli.
- **/analyze ücretsiz araç:** 65/100 skor, 4 boyutlu rubrik dökümü, uygulanabilir öneriler, "Upwork onay notları". Güçlü edinim (SEO) aracı.
- **/earnings hesaplayıcı:** Anlık, temiz, platform komisyonu + transfer + vergi kırılımı net.
- **Kredi israfı koruması (öne çıkan UX):** Alakasız casino ilanında "Bu ilan profiline pek uymuyor, yine de analiz edilsin mi?" uyarısı verip **krediyi harcamadı.** Rakiplerde nadir, çok iyi.
- **Koyu tema + İngilizce i18n:** Landing'de tam ve cilalı; eksik/çeviri kaçağı görülmedi.
- **Mobil hamburger menü çalışıyor** (eski denetimdeki eksik kapatılmış).
- **Onboarding akıcı:** Kayıt → içe aktarma sihirbazı → dashboard sorunsuz; e-posta doğrulama zorunlu değil (sürtünmesiz).
- Sunucu tarafı runtime hatası / 500 görülmedi (oturum boyunca temiz).

---

## 🔴 P0 — Yayına çıkışı bloklayan / kritik

### 1. İş feed'i çekirdek vaadi karşılamıyor (en büyük sorun)
- Havuzda **toplam 50 ilan var ve hepsi RemoteOK'ten** — hepsi **remote tam-zamanlı iş ilanı**, freelance pazaryeri (Upwork/Bionluk/Fiverr/Armut) **gig'i değil.** Ürün "ilanlarla eşleştir" diyor ama iş panosu kırıntısı sunuyor.
- **Etiket çıkarımı bozuk:** RemoteOK ilanlarının **hepsinde birebir aynı** etiketler görünüyor: `design · consulting · exec · customer support`. Gerçek beceri etiketi değil → eşleştirme ve arama bu etiketlere güvenemez.
- **Çöp ilanlar:** "Tüm Pozisyonlar", "Özel Hizmetler Uzmanı AIRDRIE", "Online Casino Oyun Testçisi" (spam anahtar-kelime oyunu içeren MLM tarzı) gibi kalitesiz ilanlar havuzu kirletiyor.
- **Tasarımcı için feed pratikte boş:** Ürün/grafik tasarımcı profiliyle "Tüm eşleşen işler" **tek** sonuç gösterdi: **"Ofis Asistanı"** (CSS/excel/frontend/git) — tamamen alakasız yanlış eşleşme.
- **Etki:** Yeni kullanıcı çekirdek özelliği açtığında değeri göremiyor; developer olmayan segment (tasarımcı, çevirmen, sosyal medya) için feed kullanılamaz.
- **Öneri:** (a) Kaynak kalitesini filtrele (spam/junk başlık ele); (b) etiket normalize'ını düzelt (RemoteOK gerçek tag alanını kullan); (c) developer-dışı kategorileri de besle veya en azından "senin alanında yeni ilan yok" boş-durumunu dürüstçe göster; (d) uzun vade: freelance pazaryeri ilanı yoksa bu özelliğin konumlandırmasını "remote iş radarı" olarak netleştir, aksi halde vaat–gerçek boşluğu güveni yıkar.

### 2. KVKK veri sorumlusu kimliği hâlâ yer tutucu (legal)
- `/kvkk`: *"Veri sorumlusu **[Şirket Ünvanı], [Adres], [VKN / sicil no]**'dur"* — doldurulmamış. KVKK m.10 aydınlatma yükümlülüğü **geçerli değil.**
- İletişim olarak **kişisel Gmail** (`yanlizcakaan@gmail.com`) yasal metinde herkese açık. Ödeme almaya başlamadan mutlaka gerçek unvan/adres/VKN + kurumsal e-posta girilmeli.
- Aynı risk gizlilik/şartlar şablonlarında da olabilir — hepsi hukuk incelemesinden geçmeli (metin zaten "taslaktır" uyarısı taşıyor).

### 3. Sahte referanslar (testimonial) — güven + legal risk
- Landing "İlk kullanıcılardan / **Freelancer'lar ne diyor?**" başlığı altında **3 uydurma alıntı** (dönen marquee'de tekrarlanıyor), jenerik avatarlarla gerçek müşteri görüşü gibi sunuluyor.
- Henüz gerçek kullanıcı yokken bu, yanıltıcı reklam sayılabilir (TR'de reklam kurulu/ tüketici hassasiyeti). Beta öncesi **gerçek görüşlerle değiştir** veya kaldır. (Bu risk daha önce de not edilmişti.)

---

## 🟡 P1 — Önemli UX / dönüşüm

### 4. Oturumsuz ziyaretçi için CTA yanlış: her yerde "Dashboard'a Git"
- Landing hero, header ve alt CTA'nın hepsi **"Dashboard'a Git" / "Dashboard"**. İlk kez gelen ziyaretçinin dashboard'u yok. Net bir **"Ücretsiz Başla / Kayıt Ol"** ya da **"Giriş Yap"** çağrısı yok.
- Buton `/login`'e düşürüyor ama metin yanlış beklenti kuruyor → dönüşüm kaybı. Oturum durumuna göre metin değişmeli (oturumsuz: "Ücretsiz Başla", oturumlu: "Dashboard").

### 5. Kayıt formunda KVKK/Şartlar onay kutusu yok
- `/signup`'ta açık rıza / şartları kabul onayı yok. Veri işleyen + ödeme alacak bir TR ürünü için kayıt anında **"Gizlilik ve KVKK'yı okudum/kabul ediyorum"** onayı beklenir.

### 6. Public portfolyoda varsayılan iletişim/işe-al CTA'sı yok
- Yayınlanan `/p/[slug]` sayfası şık ama ziyaretçinin freelancer'a **ulaşabileceği hiçbir buton yok** → dönüşüm çıkmazı. İletişim (email/link) özelliği kodda var ama varsayılan gelmiyor/öne çıkmıyor. Portfolyonun amacı "müşteriye link at" olduğuna göre bir "İletişime geç / İşe al" CTA'sı varsayılan olmalı.

### 7. Portfolyo slug'ı anlamsız rasgele hex
- Yeni portfolyo `/p/241f5bee` gibi **rasgele hex** ile geliyor. Paylaşılacak URL'in okunur olması gerek — profil adı/username'den türetilmiş bir varsayılan (`/p/esma-tasarim`) öner.

---

## 🟢 P2 — Cila / ikincil

### 8. Havuz ilan kalitesi güveni aşındırıyor
- "Online Casino Oyun Testçisi" ilanı, başvuranı "RELENT / RNTQuMjI2..." gibi anahtar kelimeler yazmaya zorlayan spam/MLM tarzı bir metin. Bu tür ilanlar feed'de görününce ürünün ciddiyeti zedeleniyor. Kaynak/başlık kara listesi eklenebilir.

### 9. Ödeme "Yakında" — landing satışı boşa düşürüyor
- Fiyat kartlarının hepsi "Yakında" + "Dashboard'a Git". Iyzico kodlanmış ama kapalı (beklenen durum). Yine de landing'de fiyatı gören kullanıcı satın alamıyor; go-live'da bu açılmalı yoksa fiyat bölümü ölü ağırlık.

### 10. E-posta doğrulama banner'ı her sekmede tekrar
- Doğrulama banner'ı tüm dashboard sayfalarında sürekli görünüyor (biraz ısrarcı). "Kapat" var ama sekme değişince geri geliyor — kabul edilebilir, ama tek sefer kapatınca hatırlanması daha iyi olur.

### 11. Alaka sıralaması zayıf eşleşmeyi tepeye koyuyor
- Kredi koruması casino ilanını doğru "0 uyum" işaretledi; ancak feed'de tepe "eşleşme" olarak alakasız "Ofis Asistanı" gösterildi. Boş-durum ("alan eşleşmesi yok") zayıf eşleşme göstermekten daha dürüst.

---

## Özet öncelik sırası
1. **İş feed'i veri kalitesi + etiket bug'ı + kategori kapsamı** (P0-1) — ürünün merkezi vaadi.
2. **KVKK/legal kimlik doldurma** (P0-2) — ödeme öncesi zorunlu.
3. **Sahte testimonial'ları değiştir** (P0-3).
4. **Oturumsuz CTA metni** + **kayıt onay kutusu** + **portfolyo iletişim CTA** (P1) — dönüşüm.
5. Slug varsayılanı, havuz spam filtresi, ödeme açılışı (P2).

**Genel kanaat:** Çekirdek AI hattı (içe aktarma → uyarlama → portfolyo → analiz) beta'ya hazır ve etkileyici. Yayına çıkmadan önce **iş feed'i veri kalitesi** ve **legal/CTA boşlukları** kapatılmalı; bunlar teknik değil, içerik ve dürüstlük/dönüşüm meselesi.
