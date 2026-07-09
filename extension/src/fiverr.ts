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

// Bir metin gövdesi portföy yanıtına benziyorsa parse edip biriktir (yan-etki, bulletproof).
function absorbPortfolioText(t: string): void {
  if (!t || (t.indexOf('"firstProject"') === -1 && t.indexOf('"totalProjects"') === -1)) return;
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

// Sayfanın portföy isteğini AKTİF tekrarla (tüm projeler için limit=totalCount).
// Gerçek tarayıcıda site cookie/token'larıyla geçer; PX 403'lerse sessizce vazgeç (pasif
// hook'tan gelen veriyle yetin). Site'nin başlıklarını taklit et (x-requested-with şart).
async function activeFetchPortfolio(username: string, total: number | null): Promise<void> {
  if (!username) return;
  try {
    const w = window as unknown as {
      initialData?: { FiverrContext?: { csrfToken?: string } };
      bigQueryEnrichment?: { page?: { ctx_id?: string } };
    };
    const headers: Record<string, string> = { accept: "application/json", "x-requested-with": "XMLHttpRequest" };
    const csrf = w.initialData?.FiverrContext?.csrfToken;
    if (csrf) headers["x-csrf-token"] = csrf;
    const ctx = w.bigQueryEnrichment?.page?.ctx_id;
    if (ctx) headers["fvrr-page-ctx-id"] = ctx;

    const limit = Math.min(Math.max(total ?? 50, 5), 50); // API tavanı belirsiz → 50'de sınırla
    const res = await _fetch(`/portfolio/api/sellers/${encodeURIComponent(username)}/portfolio?roleIds=&limit=${limit}`, {
      credentials: "include",
      headers,
    });
    if (!res.ok) return; // 403 = PX bloğu → pasif hook'a güven
    const json = await res.json();
    if (json && !json.appId) mergePortfolio(portfolioStore, portfolioProjectsFromResponse(json));
  } catch {
    /* ağ/parse hatası → pasif hook'a güven */
  }
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
      await activeFetchPortfolio(sellerUsername(), total);

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
