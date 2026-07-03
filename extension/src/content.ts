// Content script: Upwork/Fiverr profil sayfasına buton enjekte eder; tıklanınca
// görünür metni + best-effort medya URL'lerini toplayıp background'a yollar.
// Alan-alan CSS seçici parse YOK (bilinçli karar) — metin AI'a, görseller URL olarak.
import { detectProfilePage, clampText, pickImageUrls } from "./extract";
import { MSG } from "./messages";

const platform = detectProfilePage(location.hostname, location.pathname);

// Çift kapı: URL deseni + sayfada gerçek bir profil başlığı (h1) olması.
// SPA gecikmesine karşı kısa aralıklarla birkaç kez denenir.
if (platform) {
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (document.querySelector("h1")) {
      clearInterval(timer);
      injectButton();
    } else if (tries >= 20) {
      clearInterval(timer); // profil işareti yok — buton gösterilmez
    }
  }, 500);
}

type ImportResponse =
  | { ok: true }
  | { ok: false; reason: "auth" | "rate" | "invalid" | "error"; message?: string };

function collectPayload() {
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

function injectButton() {
  // Closed shadow root: host sayfa CSS'i butonu bozamasın.
  const host = document.createElement("div");
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
  btn.textContent = MSG.button;
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
      a.textContent = " Open login";
      a.addEventListener("click", () => chrome.runtime.sendMessage({ type: "openLogin" }));
      note.appendChild(a);
    }
  }

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = MSG.sending;
    note.hidden = true;
    chrome.runtime.sendMessage(collectPayload(), (res: ImportResponse | undefined) => {
      btn.disabled = false;
      btn.textContent = MSG.button;
      if (res?.ok) {
        show(MSG.success);
        return;
      }
      switch (res?.reason) {
        case "auth": show(MSG.authNeeded, true); break;
        case "rate": show(MSG.rateLimited); break;
        case "invalid": show(res.message || MSG.emptyPage); break;
        default: show(MSG.genericError);
      }
    });
  });
}
