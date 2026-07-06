// Content script: Upwork/Fiverr/LinkedIn profil sayfasına buton enjekte eder; tıklanınca
// görünür metni + best-effort medya URL'lerini toplayıp background'a yollar.
// Alan-alan CSS seçici parse YOK (bilinçli karar) — metin AI'a, görseller URL olarak.
import { detectProfilePage, clampText, pickImageUrls, type ProfilePlatform } from "./extract";
import { msg } from "./messages";

const HOST_ID = "mf-import-host";
let injectedForPath = ""; // buton hangi pathname için enjekte edildi (çift enjeksiyon guard)

type ImportResponse =
  | { ok: true }
  | { ok: false; reason: "auth" | "rate" | "invalid" | "error"; message?: string };

function removeButton() {
  document.getElementById(HOST_ID)?.remove();
  injectedForPath = "";
}

// Profil sayfası mı + içerik yüklendi mi → butonu enjekte et. `<h1>` tek başına yeterli
// DEĞİL (bazı profiller ismi/başlıkları h2/div'de tutar) → h1|h2 VEYA "yeterli metin"
// kabul edilir; hiçbiri gelmezse uzun beklemeden sonra dolu içerik varsa yine gösterilir.
// Cloudflare "insan mısın" sayfaları kısa metinlidir → yanlışlıkla tetiklenmez.
function maybeInit() {
  const platform = detectProfilePage(location.hostname, location.pathname);
  const path = location.pathname;

  if (!platform) { removeButton(); return; }                       // profil sayfası değil
  if (injectedForPath === path && document.getElementById(HOST_ID)) return; // zaten var
  removeButton(); // URL değişmiş olabilir → eski butonu temizle

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    // Bu arada başka sayfaya geçtiysek bırak.
    if (detectProfilePage(location.hostname, location.pathname) !== platform || location.pathname !== path) {
      clearInterval(timer);
      return;
    }
    const hasHeading = !!document.querySelector("h1, h2");
    const enoughText = (document.body?.innerText?.trim().length ?? 0) > 500;
    if (hasHeading && enoughText) {
      clearInterval(timer);
      injectButton(platform);
    } else if (tries >= 30) {          // ~15 sn: başlık gelmediyse bile dolu içerik varsa göster
      clearInterval(timer);
      if (enoughText) injectButton(platform);
    }
  }, 500);
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
  const text = clampText((main ?? document.body).innerText);

  const avatarUrl = findAvatarUrl();

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

function injectButton(platform: ProfilePlatform) {
  if (document.getElementById(HOST_ID)) return; // çift guard
  injectedForPath = location.pathname;

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
  `;
  root.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "mf-btn";
  btn.textContent = msg("button");
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

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = msg("sending");
    note.hidden = true;
    // Upwork'te portfolyo sayfaları gezildiği için birkaç saniye sürebilir (buton "gönderiliyor").
    const payload = await collectPayload(platform);
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
