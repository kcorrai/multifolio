// MAIN-world content script (Fiverr). İzole content.ts sayfanın JS global'lerine ve
// site fetch'lerine ERİŞEMEZ. Bu script MAIN dünyada çalışıp iki kaynaktan veri toplar:
//  1) window.__PERSEUS__initialProps (JSON) → seller profili (mapFiverrProps).
//  2) /portfolio/api/sellers/{u}/portfolio → gerçek PROJELER (portföy). Lazy yüklenir;
//     iki yolla yakalanır: (a) sayfanın kendi isteğini PASİF fetch/XHR hook'u ile yakala
//     (bot koruması PX'i tetiklemez — site kendi token'larıyla çağırır); (b) istek anında
//     AKTİF fetch dene (gerçek tarayıcıda tüm projeleri çeker; PX 403'lerse (a)'ya düşer).
// content.ts "mf-get-fiverr" ile ister → "mf-fiverr" (JSON) döner.
import {
  mapFiverrProps,
  portfolioProjectsFromResponse,
  mergePortfolio,
  rawToProject,
  dedupeFiverrImages,
  type PortfolioProjectRaw,
  type FiverrExtract,
} from "./fiverr-map";

const portfolioStore = new Map<string, PortfolioProjectRaw>();

// Portföy yanıt gövdesini (liste VEYA per-proje detay) parse edip biriktir (yan-etki,
// bulletproof). Yalnız /portfolio/api/ URL'lerinden çağrılır → içerik-guard gereksiz.
function absorbPortfolioText(t: string): void {
  if (!t || t.charCodeAt(0) !== 123 /* '{' */) return;
  try {
    mergePortfolio(portfolioStore, portfolioProjectsFromResponse(JSON.parse(t)));
  } catch {
    /* JSON değil */
  }
}

// fetch/XHR yanıtlarını PASİF yakala: sayfa portföy bölümünü görünce isteği kendi yapar.
const _fetch = window.fetch;
window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
  return _fetch.apply(this, args).then((res: Response) => {
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
      if (/\/portfolio\/api\//i.test(url)) res.clone().text().then(absorbPortfolioText).catch(() => {});
    } catch {
      /* clone başarısız */
    }
    return res;
  });
} as typeof fetch;

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...a: unknown[]) {
  try {
    if (/\/portfolio\/api\//i.test(String(a[1] ?? ""))) {
      this.addEventListener("load", function (this: XMLHttpRequest) {
        try { absorbPortfolioText(this.responseText || ""); } catch { /* */ }
      });
    }
  } catch { /* */ }
  return (_open as (...a: unknown[]) => void).apply(this, a);
} as typeof XMLHttpRequest.prototype.open;

// window.__PERSEUS__initialProps string ise parse et; obje ise doğrudan kullan.
function readPerseusProps(): unknown {
  try {
    const w = window as unknown as { __PERSEUS__initialProps?: unknown };
    const raw = w.__PERSEUS__initialProps;
    if (typeof raw === "string") return JSON.parse(raw);
    return raw ?? null;
  } catch {
    return null;
  }
}

function sellerUsername(): string {
  return location.pathname.replace(/^\/(users\/)?/, "").replace(/\/.*$/, "");
}

// Site'nin XHR başlıklarını taklit eder (PerimeterX için x-requested-with şart).
function portfolioHeaders(): Record<string, string> {
  const w = window as unknown as {
    initialData?: { FiverrContext?: { csrfToken?: string } };
    bigQueryEnrichment?: { page?: { ctx_id?: string } };
  };
  const headers: Record<string, string> = { accept: "application/json", "x-requested-with": "XMLHttpRequest" };
  const csrf = w.initialData?.FiverrContext?.csrfToken;
  if (csrf) headers["x-csrf-token"] = csrf;
  const ctx = w.bigQueryEnrichment?.page?.ctx_id;
  if (ctx) headers["fvrr-page-ctx-id"] = ctx;
  return headers;
}

// Bir portföy URL'ini AKTİF fetch'le, yanıtı biriktir. Gerçek tarayıcıda site cookie/
// token'larıyla geçer; PX 403'lerse sessizce vazgeç (pasif hook'tan gelen veriyle yetin).
async function fetchPortfolio(path: string): Promise<void> {
  try {
    const res = await _fetch(path, { credentials: "include", headers: portfolioHeaders() });
    if (!res.ok) return; // 403 = PX bloğu → pasif hook'a güven
    const json = await res.json();
    if (json && !json.appId) mergePortfolio(portfolioStore, portfolioProjectsFromResponse(json));
  } catch {
    /* ağ/parse hatası → pasif hook'a güven */
  }
}

// TÜM projeleri tam detayıyla çeker: (1) liste (id+başlık+kapak, tüm projeler) →
// (2) her projenin per-proje detay endpoint'i (/portfolio/{id}: açıklama+etiket+tüm
// görseller). Liste boşsa (PX bloğu) pasif hook'un yakaladığıyla yetin.
async function harvestPortfolio(username: string, total: number | null): Promise<void> {
  if (!username) return;
  const base = `/portfolio/api/sellers/${encodeURIComponent(username)}/portfolio`;
  const limit = Math.min(Math.max(total ?? 50, 5), 50); // API tavanı belirsiz → 50'de sınırla
  await fetchPortfolio(`${base}?roleIds=&limit=${limit}`);

  // Detaysız (sığ) projeleri per-proje endpoint'ten zenginleştir (en çok 30, ölçekli).
  const ids = [...portfolioStore.values()].filter((p) => p.id && !p.detailed).map((p) => p.id).slice(0, 30);
  await Promise.all(ids.map((id) => fetchPortfolio(`${base}/${encodeURIComponent(id)}`)));
}

document.addEventListener("mf-get-fiverr", () => {
  void (async () => {
    let payload = "null";
    try {
      const props = readPerseusProps();
      const profile = mapFiverrProps(props);
      if (!profile) {
        document.dispatchEvent(new CustomEvent("mf-fiverr", { detail: "null" }));
        return;
      }
      const total =
        props && typeof props === "object"
          ? ((props as { seller?: { portfolios?: { totalCount?: number } } }).seller?.portfolios?.totalCount ?? null)
          : null;
      await harvestPortfolio(sellerUsername(), total);

      const projects = [...portfolioStore.values()].map(rawToProject);
      const images = dedupeFiverrImages(projects.flatMap((p) => p.images.map((i) => i.url)));
      const extract: FiverrExtract = {
        text: profile.text,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills,
        projects: projects.slice(0, 30),
        images: images.slice(0, 50),
      };
      payload = JSON.stringify(extract);
    } catch {
      payload = "null";
    }
    document.dispatchEvent(new CustomEvent("mf-fiverr", { detail: payload }));
  })();
});
