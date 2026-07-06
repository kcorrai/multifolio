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

// Portfolyo pager'ının "sonraki sayfa" düğmesi (heuristik; Upwork DOM'una gevşek bağlı —
// aria-label/data-test/title'da next|forward|sonraki geçen görünür düğme).
function findPortfolioNextButton(): HTMLElement | null {
  const cands = Array.from(document.querySelectorAll<HTMLElement>('button, a[role="button"], [role="button"]'));
  for (const el of cands) {
    if ((el as HTMLButtonElement).disabled) continue;
    if (el.getAttribute("aria-disabled") === "true") continue;
    const meta = [el.getAttribute("aria-label"), el.getAttribute("data-test"), el.getAttribute("data-ev-label"), el.title]
      .filter(Boolean).join(" ").toLowerCase();
    if (!/next|forward|sonraki/.test(meta)) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
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

// Route-tabanlı modal (?p=) → history.back ile kapanır; olmazsa Escape.
async function closeModal(): Promise<void> {
  if (!findOpenModal()) return;
  history.back();
  await sleep(900);
  if (!findOpenModal()) return;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(500);
}

// Upwork portfolyosunu TÜM sayfalardan + her projenin İÇİNDEKİ görsellerden toplar.
// Kapaklar URL deseniyle güvenle toplanır (Phase-safe); her proje modalı açılınca iç
// görseller de DOM'a gelip toplanır. Modal aç/kapa BEST-EFFORT + guard'lı — patlarsa
// kapaklar yine gelir (çalışan davranış korunur). En fazla 12 sayfa; ilerleme yoksa durur.
async function harvestUpworkPortfolio(): Promise<string[]> {
  const images = new Set<string>();
  const openedCovers = new Set<string>();
  const grab = () => collectUpworkPortfolioDom().forEach((u) => images.add(u));
  grab();

  async function openProjectsHere() {
    for (const { el, cover } of findProjectCards()) {
      if (openedCovers.has(cover)) continue;
      openedCovers.add(cover);
      try {
        (el.querySelector("img") ?? el).click(); // proje modalını aç
        await sleep(1500);                        // iç görseller yüklensin
        grab();
        await closeModal();
        await sleep(300);
      } catch { /* bu projeyi atla — kapaklar yine toplandı */ }
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
  return [...images];
}

async function collectPayload(platform: ProfilePlatform) {
  // Ana içerik bölgesi varsa onu, yoksa tüm gövdeyi al (nav/footer gürültüsünü AI tolere eder).
  const main = document.querySelector("main");
  const text = clampText((main ?? document.body).innerText);

  const avatarUrl = findAvatarUrl();

  // Portfolyo görselleri:
  //  - Upwork: sabit CDN deseni + sayfalar arası gezip TÜMÜNÜ topla.
  //  - Diğerleri: başlığı /portfolio/i geçen bölümün altındaki görseller (best-effort).
  let portfolioRaw: string[] = [];
  if (platform === "upwork") {
    portfolioRaw = await harvestUpworkPortfolio();
  } else {
    for (const heading of document.querySelectorAll("h2, h3")) {
      if (!/portfolio/i.test(heading.textContent ?? "")) continue;
      const section = heading.closest("section") ?? heading.parentElement;
      if (!section) continue;
      for (const img of section.querySelectorAll("img")) portfolioRaw.push((img as HTMLImageElement).src);
    }
  }
  const portfolioImages = pickImageUrls(portfolioRaw, 50);

  return {
    type: "import" as const,
    platform,
    sourceUrl: location.origin + location.pathname,
    text,
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(portfolioImages.length ? { portfolioImages } : {}),
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
