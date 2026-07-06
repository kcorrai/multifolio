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

function collectPayload(platform: ProfilePlatform) {
  // Ana içerik bölgesi varsa onu, yoksa tüm gövdeyi al (nav/footer gürültüsünü AI tolere eder).
  const main = document.querySelector("main");
  const text = clampText((main ?? document.body).innerText);

  // Avatar: og:image en güvenilir aday (her iki platform da koyar).
  const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  const [avatarUrl] = pickImageUrls(og?.content ? [og.content] : [], 1);

  // Portfolyo: başlığı /portfolio/i geçen bölümün altındaki görseller (best-effort).
  const portfolioImgs: string[] = [];
  for (const heading of document.querySelectorAll("h2, h3")) {
    if (!/portfolio/i.test(heading.textContent ?? "")) continue;
    const section = heading.closest("section") ?? heading.parentElement;
    if (!section) continue;
    for (const img of section.querySelectorAll("img")) portfolioImgs.push(img.src);
  }
  const portfolioImages = pickImageUrls(portfolioImgs, 12);

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

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = msg("sending");
    note.hidden = true;
    chrome.runtime.sendMessage(collectPayload(platform), (res: ImportResponse | undefined) => {
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
