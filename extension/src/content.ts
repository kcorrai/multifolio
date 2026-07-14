// Content script: Upwork/Fiverr/LinkedIn profil sayfasına buton enjekte eder; tıklanınca
// görünür metni + best-effort medya URL'lerini toplayıp background'a yollar.
// Alan-alan CSS seçici parse YOK (bilinçli karar) — metin AI'a, görseller URL olarak.
import { detectProfilePage, detectJobPage, detectApplyPage, extractJobBudget, clampText, pickImageUrls, type ProfilePlatform, type JobPlatform } from "./extract";
import { dedupeFiverrImages, type FiverrExtract } from "./fiverr-map";
import { msg } from "./messages";

const HOST_ID = "mf-import-host";
let injectedForPath = ""; // buton hangi pathname için enjekte edildi (çift enjeksiyon guard)

// Butonun ne yapacağını belirleyen hedef: profil import'u, iş yakalama veya teklif yapıştır.
type InjectTarget =
  | { kind: "import"; platform: ProfilePlatform }
  | { kind: "job"; platform: JobPlatform }
  | { kind: "apply" };

type ImportResponse =
  | { ok: true }
  | { ok: false; reason: "auth" | "rate" | "invalid" | "error"; message?: string };

type ProposalResponse =
  | { ok: true; content: string }
  | { ok: false; reason: "auth" | "empty" | "error" };

type GenerateResponse =
  | { ok: true; content: string }
  | { ok: false; reason: "auth" | "rate" | "generate" | "error"; message?: string };

function removeButton() {
  document.getElementById(HOST_ID)?.remove();
  injectedForPath = "";
}

// Profil sayfası mı + içerik yüklendi mi → butonu enjekte et. `<h1>` tek başına yeterli
// DEĞİL (bazı profiller ismi/başlıkları h2/div'de tutar) → h1|h2 VEYA "yeterli metin"
// kabul edilir; hiçbiri gelmezse uzun beklemeden sonra dolu içerik varsa yine gösterilir.
// Cloudflare "insan mısın" sayfaları kısa metinlidir → yanlışlıkla tetiklenmez.
function maybeInit() {
  const profile = detectProfilePage(location.hostname, location.pathname);
  // Profil öncelikli; değilse iş ilanı, değilse başvuru (cover-letter) sayfası mı? Desenler ayrık.
  const jobPlatform = profile ? null : detectJobPage(location.hostname, location.pathname);
  const isApply = !profile && !jobPlatform && detectApplyPage(location.hostname, location.pathname);
  const target: InjectTarget | null = profile
    ? { kind: "import", platform: profile }
    : jobPlatform
      ? { kind: "job", platform: jobPlatform }
      : isApply
        ? { kind: "apply" }
        : null;
  const path = location.pathname;

  if (!target) { removeButton(); return; }                         // profil/ilan sayfası değil
  if (injectedForPath === path && document.getElementById(HOST_ID)) return; // zaten var
  removeButton(); // URL değişmiş olabilir → eski butonu temizle

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    // Bu arada başka sayfaya geçtiysek bırak (path değişimi = SPA navigasyonu).
    if (location.pathname !== path) {
      clearInterval(timer);
      return;
    }
    const hasHeading = !!document.querySelector("h1, h2");
    const enoughText = (document.body?.innerText?.trim().length ?? 0) > 500;
    if (hasHeading && enoughText) {
      clearInterval(timer);
      injectButton(target);
    } else if (tries >= 30) {          // ~15 sn: başlık gelmediyse bile dolu içerik varsa göster
      clearInterval(timer);
      if (enoughText) injectButton(target);
    }
  }, 500);
}

// İş ilanı sayfasından başlık + açıklama + best-effort şirket/bütçe toplar.
// title/description yetersizse null (buton "okunamadı" gösterir).
function findJobCompany(platform: JobPlatform): string | undefined {
  if (platform !== "linkedin") return undefined; // Upwork müşterisi anonim
  const el = document.querySelector(
    ".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__org-name-link",
  );
  const t = el?.textContent?.trim();
  return t ? t.slice(0, 100) : undefined;
}

function collectJobPayload(platform: JobPlatform) {
  const title = (document.querySelector("h1")?.textContent || document.title || "").trim().slice(0, 200);
  const main = document.querySelector("main");
  const description = clampText((main ?? document.body).innerText, 10_000);
  if (title.length < 2 || description.length < 10) return null;
  const budget = extractJobBudget(description);
  const company = findJobCompany(platform);
  return {
    type: "capture_job" as const,
    title,
    description,
    platform,
    ...(company ? { company } : {}),
    url: location.origin + location.pathname,
    ...(budget ? { budget } : {}),
  };
}

// Cover-letter kutusunu bulur: önce odaklı düzenlenebilir öğe, yoksa en büyük görünür
// textarea, son çare en büyük görünür contenteditable. Bulunamazsa null.
function findCoverLetterBox(): { el: HTMLElement; kind: "textarea" | "editable" } | null {
  const active = document.activeElement as HTMLElement | null;
  if (active instanceof HTMLTextAreaElement) return { el: active, kind: "textarea" };
  if (active?.getAttribute?.("contenteditable") === "true") return { el: active, kind: "editable" };

  const largestVisible = <T extends HTMLElement>(sel: string): T | null => {
    let best: T | null = null;
    let bestArea = 0;
    for (const el of Array.from(document.querySelectorAll<T>(sel))) {
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 40) continue; // ikon/gizli değil, gerçek kutu
      const area = r.width * r.height;
      if (area > bestArea) { bestArea = area; best = el; }
    }
    return best;
  };

  const ta = largestVisible<HTMLTextAreaElement>("textarea");
  if (ta) return { el: ta, kind: "textarea" };
  const ce = largestVisible<HTMLElement>('[contenteditable="true"]');
  if (ce) return { el: ce, kind: "editable" };
  return null;
}

// Teklifi kutuya yazar (React controlled input için native setter + input olayı).
// AUTO-SUBMIT YOK — yalnız doldurur; kullanıcı kontrol edip kendi gönderir.
function insertProposalIntoPage(text: string): boolean {
  const box = findCoverLetterBox();
  if (!box) return false;
  box.el.focus();
  if (box.kind === "textarea") {
    const ta = box.el as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) setter.call(ta, text); else ta.value = text;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    box.el.textContent = text;
    box.el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return true;
}

// Üst bölgede, kabaca kare, makul boyutlu bir görsel = profil fotosu (en olası).
function isAvatarRect(r: DOMRect): boolean {
  if (r.top < 0 || r.top > 1000) return false;           // hero/üst bölge
  if (r.width < 40 || r.height < 40) return false;        // ikon değil
  if (r.width > 460 || r.height > 460) return false;      // banner/kapak değil
  const ratio = r.width / r.height;
  return ratio >= 0.7 && ratio <= 1.4;                    // kareye yakın
}

// Avatar tespiti (Upwork/Fiverr'da og:image çoğu zaman kullanıcı fotosu DEĞİL):
// 1) og:image (LinkedIn güvenilir) → 2) üst bölgede kare <img> → 3) arka-plan görseli.
function findAvatarUrl(): string | undefined {
  const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  const [ogUrl] = pickImageUrls(og?.content ? [og.content] : [], 1);
  if (ogUrl) return ogUrl;

  const imgUrls: string[] = [];
  for (const img of Array.from(document.querySelectorAll("img"))) {
    if (!isAvatarRect(img.getBoundingClientRect())) continue;
    const src = img.currentSrc || img.src;
    if (src) imgUrls.push(src);
  }
  const [imgAvatar] = pickImageUrls(imgUrls, 1);
  if (imgAvatar) return imgAvatar;

  // Fallback: avatar CSS background-image ise (öğe taramasını sınırla — tek tıkta çalışır).
  const bgUrls: string[] = [];
  let scanned = 0;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
    if (++scanned > 2500) break;
    if (!isAvatarRect(el.getBoundingClientRect())) continue;
    const m = /url\(["']?(https:\/\/[^"')]+)["']?\)/i.exec(getComputedStyle(el).backgroundImage);
    if (m) bgUrls.push(m[1]);
    if (bgUrls.length >= 8) break;
  }
  const [bgAvatar] = pickImageUrls(bgUrls, 1);
  return bgAvatar;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// MAIN-world nuxt.js'ten window.__NUXT__ portfolyo projelerini ister (CustomEvent köprüsü).
// İzole content script page global'ine erişemez → MAIN script çıkarıp JSON döner.
function requestNuxtProjects(): Promise<ScrapedProject[]> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: ScrapedProject[]) => { if (done) return; done = true; document.removeEventListener("mf-projects", onResp); resolve(v); };
    const onResp = (e: Event) => {
      try { finish(JSON.parse((e as CustomEvent).detail || "[]") as ScrapedProject[]); } catch { finish([]); }
    };
    document.addEventListener("mf-projects", onResp);
    document.dispatchEvent(new CustomEvent("mf-get-projects"));
    setTimeout(() => finish([]), 2500); // MAIN yanıt vermezse (login'de veri yoksa) boş
  });
}

// MAIN-world fiverr.js'ten window.__PERSEUS__initialProps yapılandırılmış çıkarımını ister.
// İzole content script page global'ine erişemez → MAIN script okuyup JSON döner.
function requestFiverrData(): Promise<FiverrExtract | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: FiverrExtract | null) => { if (done) return; done = true; document.removeEventListener("mf-fiverr", onResp); resolve(v); };
    const onResp = (e: Event) => {
      try { finish(JSON.parse((e as CustomEvent).detail || "null") as FiverrExtract | null); } catch { finish(null); }
    };
    document.addEventListener("mf-fiverr", onResp);
    document.dispatchEvent(new CustomEvent("mf-get-fiverr"));
    setTimeout(() => finish(null), 2500); // MAIN yanıt vermezse (initialProps yoksa) null
  });
}

// Fiverr portfolyo görselleri lazy yüklenir (kaydırınca gelir); cloudinary /project_item/
// deseninde. Sayfayı birkaç kez kaydırıp portfolyo proje görsellerini toplar.
function isFiverrPortfolioImg(src: string): boolean {
  return /res\.cloudinary\.com\/.*\/attachments\/project_item\//i.test(src);
}
async function collectFiverrPortfolioDom(): Promise<string[]> {
  const out = new Set<string>();
  const grab = () => {
    for (const img of Array.from(document.querySelectorAll("img"))) {
      const src = img.currentSrc || img.src;
      if (src && isFiverrPortfolioImg(src)) out.add(src);
    }
  };
  grab();
  const h = document.body.scrollHeight;
  for (let i = 1; i <= 4; i++) {
    window.scrollTo(0, (h * i) / 5);
    await sleep(800);
    grab();
  }
  window.scrollTo(0, 0);
  return [...out];
}

// Upwork portfolyo görselleri sabit CDN deseninde: /att/download/portfolio/.../files/{id}.
// Bu desenle, portfolyo bölümü nerede/nasıl render edilirse edilsin güvenle yakalanır.
function isUpworkPortfolioImg(src: string): boolean {
  return /\/att\/download\/portfolio\//i.test(src);
}
function collectUpworkPortfolioDom(): string[] {
  const out: string[] = [];
  for (const img of Array.from(document.querySelectorAll("img"))) {
    const src = img.currentSrc || img.src;
    if (src && isUpworkPortfolioImg(src)) out.push(src.split("?")[0]);
  }
  return out;
}

// Portfolyo pager'ının "sonraki sayfa" düğmesi. Upwork KESİN selector:
// button[data-ev-label="pagination_next_page"] (Playwright ile doğrulandı — tıklayınca
// 1/3→2/3). Görünürlük ŞARTI YOK: ikon buton bazı düzenlerde 0 ölçü raporlar ama
// tıklanabilir. Bulunamazsa genel heuristik (diğer pager'lar).
function findPortfolioNextButton(): HTMLElement | null {
  const upwork = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-ev-label="pagination_next_page"]'))
    .find((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (upwork) return upwork;
  const cands = Array.from(document.querySelectorAll<HTMLElement>('button, a[role="button"], [role="button"]'));
  for (const el of cands) {
    if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") continue;
    const meta = [el.getAttribute("aria-label"), el.getAttribute("data-test"), el.getAttribute("data-ev-label"), el.title]
      .filter(Boolean).join(" ").toLowerCase();
    if (/next|forward|sonraki/.test(meta)) return el;
  }
  return null;
}

// Portfolyo proje kartları: kapak görselinin (portfolyo CDN) makul boyutlu tıklanabilir
// ata öğesi. Kart tıklanınca Upwork SPA proje modalını açar (route push ?p=).
function findProjectCards(): { el: HTMLElement; cover: string }[] {
  const out: { el: HTMLElement; cover: string }[] = [];
  const seen = new Set<HTMLElement>();
  for (const img of Array.from(document.querySelectorAll<HTMLImageElement>("img"))) {
    const cover = (img.currentSrc || img.src || "").split("?")[0];
    if (!isUpworkPortfolioImg(cover)) continue;
    let el: HTMLElement | null = img.parentElement;
    for (let up = 0; up < 6 && el; up++, el = el.parentElement) {
      const r = el.getBoundingClientRect();
      if (r.width > 120 && r.height > 100 && r.width < 800) break;
    }
    const card = el ?? img;
    if (seen.has(card)) continue;
    seen.add(card);
    out.push({ el: card, cover });
  }
  return out;
}

function findOpenModal(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="dialog"], [aria-modal="true"]');
}

// Portfolyo shelf'ini sayfalar arası gezer (modal AÇMAZ) — amaç 2-3. sayfayı API'den
// yükletmek; MAIN-world nuxt.js o yanıtları yakalayıp projeleri biriktirir. En fazla 12 sayfa.
async function paginateUpworkPortfolio(): Promise<void> {
  document.dispatchEvent(new CustomEvent("mf-scan")); // 1. sayfa store'unu biriktir
  for (let page = 0; page < 12; page++) {
    const next = findPortfolioNextButton();
    if (!next) break;
    next.click();
    await sleep(1400);                                 // sayfa API'den/store'a gelsin
    document.dispatchEvent(new CustomEvent("mf-scan")); // bu sayfanın projelerini biriktir
  }
}

// Modalı GÜVENLE kapat. history.back KULLANMA — tarayıcı geçmişinde fazla geri gidip
// kullanıcıyı SİTEDEN ATABİLİYOR. Sırasıyla: modal kapat (X) düğmesi → Escape. Kapatamazsa
// false döner (çağıran daha fazla modal açmayı durdurur).
async function closeModal(): Promise<boolean> {
  const modal = findOpenModal();
  if (!modal) return true;
  // YALNIZ modal İÇİNDEKİ kapat düğmesi (dışarıdaki yanlış "close"a tıklama = navigasyon riski).
  const btn = modal.querySelector<HTMLElement>('[aria-label*="close" i],[aria-label*="kapat" i],button[title*="close" i],[data-test*="close" i],[data-ev-label*="close" i]');
  if (btn) { btn.click(); await sleep(700); if (!findOpenModal()) return true; }
  for (const target of [document, document.body] as (Document | HTMLElement)[]) {
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
  }
  await sleep(600);
  return !findOpenModal();
}

// ── Proje modalı kazıyıcı (başlık + açıklama + beceriler + görsel altyazıları) ──
export interface ScrapedProject {
  title: string;
  description: string;
  role: string;
  skills: string[];
  images: { url: string; caption: string }[];
}

// Etiketli bölümden sonraki metin (ör. "Project description" → sonraki paragraf).
function textAfterLabel(root: HTMLElement, labelRe: RegExp): string {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,dt,strong,label,p,span,div"));
  for (let i = 0; i < nodes.length; i++) {
    const t = (nodes[i].textContent || "").trim();
    if (t.length <= 40 && labelRe.test(t)) {
      for (let j = i + 1; j < Math.min(i + 8, nodes.length); j++) {
        const nt = (nodes[j].textContent || "").trim();
        if (nt.length > 15 && !labelRe.test(nt)) return nt.slice(0, 2000);
      }
    }
  }
  return "";
}

// Bir görselin altyazısı: figcaption → yoksa yakın ata öğedeki kısa düz metin.
function imageCaption(img: HTMLImageElement): string {
  const cap = img.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
  if (cap) return cap.slice(0, 300);
  let el: HTMLElement | null = img.parentElement;
  for (let up = 0; up < 3 && el; up++, el = el.parentElement) {
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean)
      .join(" ")
      .trim();
    if (own && own.length >= 2 && own.length <= 200) return own;
  }
  return "";
}

const SKILLS_LABEL = /skills.*deliverables|skills|beceri/i;

function scrapeProjectModal(modal: HTMLElement, fallbackTitle: string): ScrapedProject {
  const title = ((modal.querySelector("h1")?.textContent || modal.querySelector("h2")?.textContent || fallbackTitle) || "").trim().slice(0, 200);
  const description = textAfterLabel(modal, /project description|proje açıklaması|description|açıklama/i);
  const role = textAfterLabel(modal, /my role|rol/i).slice(0, 200);

  // Beceriler: "Skills and deliverables" etiketli bölümdeki çip metinleri.
  let skills: string[] = [];
  const labelNode = Array.from(modal.querySelectorAll<HTMLElement>("h2,h3,h4,dt,strong,label,p,span,div"))
    .find((n) => { const t = (n.textContent || "").trim(); return t.length <= 40 && SKILLS_LABEL.test(t); });
  if (labelNode?.parentElement) {
    const chips = Array.from(labelNode.parentElement.querySelectorAll<HTMLElement>("*"))
      .filter((e) => e.childElementCount === 0)
      .map((e) => (e.textContent || "").trim())
      .filter((s) => s.length >= 2 && s.length <= 40 && !SKILLS_LABEL.test(s));
    skills = [...new Set(chips)].slice(0, 15);
  }

  const images: { url: string; caption: string }[] = [];
  const seen = new Set<string>();
  modal.querySelectorAll("img").forEach((im) => {
    const el = im as HTMLImageElement;
    const url = (el.currentSrc || el.src || "").split("?")[0];
    if (!isUpworkPortfolioImg(url) || seen.has(url)) return;
    seen.add(url);
    images.push({ url, caption: imageCaption(el) });
  });

  return { title, description, role, skills, images };
}

// Upwork portfolyosunu TÜM sayfalardan + her projenin İÇİNDEKİ zengin verisinden toplar:
// her proje modalını açar, başlık/açıklama/beceriler/görsel-altyazılarını kazır, kapatır.
// Kapak görselleri URL deseniyle güvenle toplanır; modal aç/kapa BEST-EFFORT + guard'lı —
// patlarsa kapaklar yine gelir. En fazla 12 sayfa; ilerleme yoksa durur.
async function harvestUpworkPortfolio(): Promise<{ images: string[]; projects: ScrapedProject[] }> {
  const images = new Set<string>();
  const projects: ScrapedProject[] = [];
  const openedCovers = new Set<string>();
  const grab = () => collectUpworkPortfolioDom().forEach((u) => images.add(u));
  grab();

  async function openProjectsHere() {
    for (const { el, cover } of findProjectCards()) {
      if (openedCovers.has(cover)) continue;
      openedCovers.add(cover);
      try {
        (el.querySelector("img") ?? el).click(); // proje modalını aç (SPA route ?p=)
        await sleep(1600);                        // iç görseller + veri yüklensin
        const modal = findOpenModal();
        if (modal) {
          const proj = scrapeProjectModal(modal, (el.textContent || "").trim().slice(0, 200));
          proj.images.forEach((im) => images.add(im.url));
          if (proj.images.length || proj.title) projects.push(proj);
        }
        grab();
        const closed = await closeModal();
        await sleep(300);
        // Modal kapanmadıysa dur: sonraki kart overlay'in altında kalır + takılma riski.
        if (!closed) return;
      } catch { return; }
    }
  }

  await openProjectsHere();
  for (let page = 0; page < 12; page++) {
    const next = findPortfolioNextButton();
    if (!next) break;
    const before = images.size + openedCovers.size;
    next.click();
    await sleep(1200);
    grab();
    await openProjectsHere();
    if (images.size + openedCovers.size === before) break; // ilerleme yok → dur
  }
  return { images: [...images], projects };
}

async function collectPayload(platform: ProfilePlatform) {
  // Ana içerik bölgesi varsa onu, yoksa tüm gövdeyi al (nav/footer gürültüsünü AI tolere eder).
  const main = document.querySelector("main");
  let text = clampText((main ?? document.body).innerText);

  let avatarUrl = findAvatarUrl();

  // Portfolyo:
  //  - Upwork: sayfalar arası gez + her projeyi açıp ZENGİN veri kazı (başlık/açıklama/
  //    beceriler/görsel-altyazıları) → portfolioProjects; kapak+iç görseller → portfolioImages.
  //  - Diğerleri: başlığı /portfolio/i geçen bölümün altındaki görseller (best-effort).
  let portfolioImages: string[] = [];
  let portfolioProjects: ScrapedProject[] = [];
  if (platform === "upwork") {
    // ÖNCE window.__NUXT__'tan KESİN+TAM proje verisi (MAIN-world nuxt.js): başlık/açıklama/
    // rol/beceriler + tüm görseller ve altyazıları — modal/sayfalama gerekmez. Boşsa
    // (login'de veri Vue store'da değilse) DOM/modal harvest'e düş (best-effort).
    // ÖNCE window.__NUXT__/Vue store'dan yapılandırılmış projeler (MAIN-world nuxt.js;
    // sayfalar arası gezip biriktirilir — kesin+tam). Boşsa DOM/modal harvest fallback.
    await paginateUpworkPortfolio();          // 2-3. sayfayı API'den/store'a yüklet
    const nuxt = await requestNuxtProjects();
    if (nuxt.length) {
      portfolioProjects = nuxt.slice(0, 30);
      portfolioImages = pickImageUrls(nuxt.flatMap((p) => p.images.map((i) => i.url)), 50);
    } else {
      const h = await harvestUpworkPortfolio();
      portfolioImages = pickImageUrls(h.images, 50);
      portfolioProjects = h.projects.slice(0, 30);
    }
  } else if (platform === "fiverr") {
    // Fiverr: profil verisi window.__PERSEUS__initialProps'ta; gerçek PROJELER portföy
    // API'sinde (lazy). ÖNCE portföye kaydır — bu hem lazy görselleri DOM'a getirir hem
    // sayfanın portföy API isteğini tetikler (MAIN-world fiverr.js pasif hook'u yakalar).
    // SONRA fiverr verisini iste (fiverr.js aktif fetch + biriken hook verisini birleştirir).
    const domPortfolio = await collectFiverrPortfolioDom();
    const fData = await requestFiverrData();
    if (fData) {
      if (fData.text) text = clampText(fData.text);         // gürültüsüz yapılandırılmış blok
      if (fData.avatarUrl) avatarUrl = fData.avatarUrl;      // profileImageUrl (og:image tahminine gerek yok)
      portfolioProjects = fData.projects.slice(0, 30);
      portfolioImages = pickImageUrls(dedupeFiverrImages([...fData.images, ...domPortfolio]), 50);
    } else {
      portfolioImages = pickImageUrls(dedupeFiverrImages(domPortfolio), 50);
    }
  } else {
    const raw: string[] = [];
    for (const heading of document.querySelectorAll("h2, h3")) {
      if (!/portfolio/i.test(heading.textContent ?? "")) continue;
      const section = heading.closest("section") ?? heading.parentElement;
      if (!section) continue;
      for (const img of section.querySelectorAll("img")) raw.push((img as HTMLImageElement).src);
    }
    portfolioImages = pickImageUrls(raw, 50);
  }

  return {
    type: "import" as const,
    platform,
    sourceUrl: location.origin + location.pathname,
    text,
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(portfolioImages.length ? { portfolioImages } : {}),
    ...(portfolioProjects.length ? { portfolioProjects } : {}),
  };
}

function injectButton(target: InjectTarget) {
  if (document.getElementById(HOST_ID)) return; // çift guard
  injectedForPath = location.pathname;
  const isJob = target.kind === "job";

  // Closed shadow root: host sayfa CSS'i butonu bozamasın.
  const host = document.createElement("div");
  host.id = HOST_ID;
  const root = host.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(host);

  const style = document.createElement("style");
  style.textContent = `
    .mf-btn {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border: 0; border-radius: 999px; cursor: pointer;
      background: #0B1220; color: #00F0FF;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 18px rgba(0, 0, 0, .35);
    }
    .mf-btn:hover { filter: brightness(1.15); }
    .mf-btn[disabled] { opacity: .7; cursor: default; }
    .mf-note {
      position: fixed; right: 20px; bottom: 64px; z-index: 2147483647;
      max-width: 280px; padding: 10px 14px; border-radius: 12px;
      background: #0B1220; color: #E6EDF6;
      font: 500 12px/1.5 system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 18px rgba(0, 0, 0, .35);
    }
    .mf-note a { color: #00F0FF; cursor: pointer; text-decoration: underline; }
    .mf-score {
      position: fixed; right: 20px; bottom: 64px; z-index: 2147483647;
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 999px;
      background: #0B1220; color: #E6EDF6;
      font: 700 13px/1.2 system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 18px rgba(0, 0, 0, .35);
    }
    .mf-score small { font-weight: 500; opacity: .75; }
    .mf-dot { width: 9px; height: 9px; border-radius: 999px; }
  `;
  root.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "mf-btn";
  btn.textContent = target.kind === "apply" ? msg("generateFill") : isJob ? msg("captureJob") : msg("button");
  root.appendChild(btn);

  const note = document.createElement("div");
  note.className = "mf-note";
  note.hidden = true;
  root.appendChild(note);

  function show(text: string, loginLink = false) {
    note.hidden = false;
    note.textContent = text;
    if (loginLink) {
      const a = document.createElement("a");
      a.textContent = ` ${msg("openLogin")}`;
      a.addEventListener("click", () => chrome.runtime.sendMessage({ type: "openLogin" }));
      note.appendChild(a);
    }
  }

  // Canlı eşleşme skoru (yalnız iş ilanı sayfası): profil × ilan uyumunu ÜCRETSİZ göster
  // (deterministik, kredisiz). Auth yok / profil yok / hata → sessizce gösterilmez.
  if (isJob) {
    const ctx = collectJobPayload(target.platform as JobPlatform);
    if (ctx) {
      chrome.runtime.sendMessage(
        { type: "quick_match", title: ctx.title, text: ctx.description },
        (res: { ok: boolean; score?: number; matched?: string[]; missing?: string[] } | undefined) => {
          if (!res?.ok || typeof res.score !== "number") return;
          const score = res.score;
          const badge = document.createElement("div");
          badge.className = "mf-score";
          const dot = document.createElement("span");
          dot.className = "mf-dot";
          dot.style.background = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
          const label = document.createElement("span");
          label.textContent = `${msg("matchScore")} ${score}%`;
          const sub = document.createElement("small");
          const matched = res.matched?.length ?? 0;
          const total = matched + (res.missing?.length ?? 0);
          if (total > 0) sub.textContent = `${matched}/${total}`;
          badge.append(dot, label, sub);
          // Not kutusunun üstünde konumlansın (note bottom:64 → score bottom:108).
          badge.style.bottom = "108px";
          root.appendChild(badge);
        },
      );
    }
  }

  btn.addEventListener("click", async () => {
    note.hidden = true;

    if (target.kind === "apply") {
      // Asistanlı başvuru: ÖNCE bu işe özel teklif üret (iş bağlamını başvuru sayfasından
      // topla → generate) → cover-letter kutusuna yaz. Üretilemezse (bağlam yok/genel hata)
      // "son teklifi yapıştır"a düş. AUTO-SUBMIT YOK — kullanıcı gözden geçirip kendi gönderir.
      btn.disabled = true;

      // Fallback: kullanıcının EN SON ürettiği teklifi çek → yapıştır.
      const insertLatest = () => {
        btn.textContent = msg("pasteSending");
        chrome.runtime.sendMessage({ type: "fetch_latest_proposal" }, (res: ProposalResponse | undefined) => {
          btn.disabled = false;
          btn.textContent = msg("generateFill");
          if (res?.ok) { show(insertProposalIntoPage(res.content) ? msg("pasteSuccess") : msg("pasteNoBox")); return; }
          switch (res?.reason) {
            case "auth": show(msg("authNeeded"), true); break;
            case "empty": show(msg("pasteNoProposal")); break;
            default: show(msg("genericError"));
          }
        });
      };

      btn.textContent = msg("generating");
      const ctx = collectJobPayload("upwork"); // başlık + açıklama (başvuru sayfasından)
      if (!ctx) { insertLatest(); return; }     // iş bağlamı okunamadı → son teklife düş
      chrome.runtime.sendMessage(
        { type: "generate_proposal", title: ctx.title, description: ctx.description, url: ctx.url },
        (res: GenerateResponse | undefined) => {
          if (res?.ok) {
            btn.disabled = false;
            btn.textContent = msg("generateFill");
            show(insertProposalIntoPage(res.content) ? msg("pasteSuccess") : msg("pasteNoBox"));
            return;
          }
          // Auth ve kredi/profil (generate+mesaj) yollarında kullanıcıyı bilgilendir; diğer
          // hatalarda sessizce son teklife düş.
          if (res?.reason === "auth") { btn.disabled = false; btn.textContent = msg("generateFill"); show(msg("authNeeded"), true); return; }
          if (res?.reason === "generate" && res.message) { btn.disabled = false; btn.textContent = msg("generateFill"); show(res.message); return; }
          insertLatest();
        },
      );
      return;
    }

    if (target.kind === "job") {
      // İş yakalama: başlık/açıklama topla → /api/jobs. İçerik yetersizse hata göster.
      const payload = collectJobPayload(target.platform);
      if (!payload) { show(msg("captureEmpty")); return; }
      btn.disabled = true;
      btn.textContent = msg("captureSending");
      chrome.runtime.sendMessage(payload, (res: ImportResponse | undefined) => {
        btn.disabled = false;
        btn.textContent = msg("captureJob");
        if (res?.ok) { show(msg("captureSuccess")); return; }
        switch (res?.reason) {
          case "auth": show(msg("authNeeded"), true); break;
          case "rate": show(msg("rateLimited")); break;
          case "invalid": show(res.message || msg("captureEmpty")); break;
          default: show(msg("genericError"));
        }
      });
      return;
    }

    btn.disabled = true;
    btn.textContent = msg("sending");
    // Upwork'te portfolyo sayfaları gezildiği için birkaç saniye sürebilir (buton "gönderiliyor").
    const payload = await collectPayload(target.platform);
    chrome.runtime.sendMessage(payload, (res: ImportResponse | undefined) => {
      btn.disabled = false;
      btn.textContent = msg("button");
      if (res?.ok) {
        show(msg("success"));
        return;
      }
      switch (res?.reason) {
        case "auth": show(msg("authNeeded"), true); break;
        case "rate": show(msg("rateLimited")); break;
        case "invalid": show(res.message || msg("emptyPage")); break;
        default: show(msg("genericError"));
      }
    });
  });
}

// İlk çalıştırma + SPA URL değişimini izle: Upwork/Fiverr SPA'dır; client-side geçişte
// content script yeniden ÇALIŞMAZ (aynı doküman) → URL'i pollayıp yeniden dener.
maybeInit();
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    maybeInit();
  }
}, 1000);
