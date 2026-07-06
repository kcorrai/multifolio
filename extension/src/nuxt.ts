// MAIN-world content script (Upwork). İzole content.ts sayfanın JS global'i
// window.__NUXT__'a ve fetch/XHR yanıtlarına ERİŞEMEZ. Bu script MAIN dünyada çalışıp
// TÜM portfolyo projelerini çıkarır: başlık + açıklama + rol/hedef/çözüm + beceriler
// (ontologySkill.prefLabel) + attachments (her görselin link'i ve title'ı=altyazısı).
//
// İki kaynak: (1) window.__NUXT__ / Vue store (1. sayfa SSR); (2) portfolyo API yanıtları —
// content.ts sayfaları gezdikçe (2-3. sayfa) buradaki fetch/XHR hook'u yakalar. Projeler
// uid'ye göre BİRİKTİRİLİR. content.ts "mf-get-projects" ile ister; "mf-projects" (JSON) döner.

interface NuxtImage { url: string; caption: string }
interface NuxtProject { title: string; description: string; role: string; skills: string[]; images: NuxtImage[] }

const projectsByUid = new Map<string, Record<string, unknown>>();

function abs(link: unknown): string {
  const s = typeof link === "string" ? link : "";
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "https://www.upwork.com" + s;
}

function collectRoots(): unknown[] {
  const roots: unknown[] = [];
  const w = window as unknown as { __NUXT__?: unknown };
  if (w.__NUXT__) roots.push(w.__NUXT__);
  try {
    const host = document.querySelector("#__nuxt, #__layout, #app, [data-server-rendered]") as (Element & { __vue__?: { $store?: { state?: unknown }; $root?: { $data?: unknown } } }) | null;
    const vue = host?.__vue__;
    if (vue?.$store?.state) roots.push(vue.$store.state);
    if (vue?.$root?.$data) roots.push(vue.$root.$data);
  } catch { /* __NUXT__ yeterli */ }
  return roots;
}

function isProjectObj(o: Record<string, unknown>): boolean {
  return !!o && typeof o === "object"
    && typeof o.title === "string"
    && Array.isArray(o.attachments)
    && "description" in o && "thumbnail" in o;
}

// Bir JSON kökünü BFS ile tarayıp bulduğu proje objelerini uid bazında biriktir.
function absorb(root: unknown): void {
  const seen = new Set<unknown>();
  const q: unknown[] = [root];
  let steps = 0;
  while (q.length && steps < 400000) {
    steps++;
    const o = q.shift() as Record<string, unknown> | null;
    if (!o || typeof o !== "object" || seen.has(o)) continue;
    seen.add(o);
    if (isProjectObj(o)) {
      const uid = String(o.uid ?? o.id ?? o.title);
      projectsByUid.set(uid, o); // üzerine yaz (daha dolu sürüm gelirse güncelle)
      continue;
    }
    for (const k in o) {
      try { const v = o[k]; if (v && typeof v === "object") q.push(v); } catch { /* getter */ }
    }
  }
}

function mapProject(p: Record<string, unknown>): NuxtProject {
  const tags = Array.isArray(p.tags) ? (p.tags as Array<Record<string, unknown>>) : [];
  const skills = tags
    .map((t) => ((t?.ontologySkill as Record<string, unknown> | undefined)?.prefLabel as string) || (t?.freeText as string) || "")
    .filter(Boolean);
  const descParts = [
    p.description as string,
    p.projectGoal ? `Goal: ${p.projectGoal}` : "",
    p.solution ? `Solution: ${p.solution}` : "",
  ].filter(Boolean);

  const images: NuxtImage[] = [];
  const seenU = new Set<string>();
  const pushImg = (link: unknown, caption: unknown) => {
    const u = abs(link);
    if (u && /att\/download\/portfolio/i.test(u) && !seenU.has(u)) {
      seenU.add(u);
      images.push({ url: u, caption: (typeof caption === "string" ? caption : "").slice(0, 300) });
    }
  };
  pushImg(p.thumbnailOriginal || p.thumbnail, "");
  if (Array.isArray(p.attachments)) {
    for (const a of p.attachments as Array<Record<string, unknown>>) {
      if (a?.type === "image") pushImg(a.link, a.title || a.description || "");
    }
  }

  return {
    title: String(p.title || "").slice(0, 200),
    description: descParts.join("\n\n").slice(0, 4000),
    role: String(p.role || "").slice(0, 200),
    skills: [...new Set(skills)].slice(0, 20),
    images: images.slice(0, 20),
  };
}

// fetch/XHR yanıtlarını yakala: sayfalama sonrası 2-3. sayfa API'den gelir → biriktir.
// Bulletproof: yalnız yan-etki (klon+parse try/catch); Upwork akışını değiştirmez.
const _fetch = window.fetch;
window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
  return _fetch.apply(this, args).then((res: Response) => {
    try {
      res.clone().text().then((t) => { if (t && t.indexOf('"attachments"') !== -1) { try { absorb(JSON.parse(t)); } catch { /* JSON değil */ } } }).catch(() => {});
    } catch { /* clone başarısız */ }
    return res;
  });
} as typeof fetch;

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...a: unknown[]) {
  this.addEventListener("load", function (this: XMLHttpRequest) {
    try { const t = this.responseText || ""; if (t.indexOf('"attachments"') !== -1) { try { absorb(JSON.parse(t)); } catch { /* JSON değil */ } } } catch { /* */ }
  });
  return (_open as (...a: unknown[]) => void).apply(this, a);
} as typeof XMLHttpRequest.prototype.open;

// content.ts her sayfa geçişinde tetikler → o anki store'u biriktir (store yalnız
// mevcut sayfayı tutabildiği için sayfa-sayfa biriktirmek gerekir).
document.addEventListener("mf-scan", () => { try { collectRoots().forEach(absorb); } catch { /* */ } });

document.addEventListener("mf-get-projects", () => {
  const roots = collectRoots();
  roots.forEach(absorb); // son istekte __NUXT__/store'u da tara (1. sayfa + biriken)
  let payload = "[]";
  try { payload = JSON.stringify([...projectsByUid.values()].map(mapProject)); } catch { payload = "[]"; }
  // Debug (geçici): izole content script buton notunda gösterir → sorun kaynağını görürüz.
  const w = window as unknown as { __NUXT__?: unknown };
  try {
    document.documentElement.setAttribute("data-mf-debug", JSON.stringify({
      hasNuxt: !!w.__NUXT__, roots: roots.length, found: projectsByUid.size,
    }));
  } catch { /* */ }
  document.dispatchEvent(new CustomEvent("mf-projects", { detail: payload }));
});
