// MAIN-world content script (Upwork). İzole content.ts, sayfanın JS global'i
// window.__NUXT__'a (Nuxt SSR state / Vue store) ERİŞEMEZ. Bu script MAIN dünyada çalışıp
// oradan TÜM portfolyo projelerini çıkarır: başlık + açıklama + rol/hedef/çözüm + beceriler
// (ontologySkill.prefLabel) + attachments (her görselin link'i ve title'ı=altyazısı).
// content.ts bir CustomEvent ile ister ("mf-get-projects"); yanıt "mf-projects" (JSON string
// detail — dünyalar arası güvenli klonlanır). Modal açma / sayfalama GEREKMEZ.

interface NuxtImage { url: string; caption: string }
interface NuxtProject { title: string; description: string; skills: string[]; images: NuxtImage[] }

function abs(link: unknown): string {
  const s = typeof link === "string" ? link : "";
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "https://www.upwork.com" + s;
}

// Portfolyo verisi genelde window.__NUXT__'ta; login'li sayfada Vue store'a düşmüş olabilir.
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

function extractProjects(): NuxtProject[] {
  const byUid = new Map<string, Record<string, unknown>>();
  const seen = new Set<unknown>();
  const q: unknown[] = [...collectRoots()];
  let steps = 0;
  while (q.length && steps < 300000) {
    steps++;
    const o = q.shift() as Record<string, unknown> | null;
    if (!o || typeof o !== "object" || seen.has(o)) continue;
    seen.add(o);
    if (isProjectObj(o)) {
      const uid = String(o.uid ?? o.id ?? o.title);
      if (!byUid.has(uid)) byUid.set(uid, o);
      continue; // projenin içine inme (diğer projeleri kaçırmayız)
    }
    for (const k in o) {
      try { const v = o[k]; if (v && typeof v === "object") q.push(v); } catch { /* getter patlarsa atla */ }
    }
  }

  return [...byUid.values()].map((p): NuxtProject => {
    const tags = Array.isArray(p.tags) ? (p.tags as Array<Record<string, unknown>>) : [];
    const skills = tags
      .map((t) => ((t?.ontologySkill as Record<string, unknown> | undefined)?.prefLabel as string) || (t?.freeText as string) || "")
      .filter(Boolean);
    const descParts = [
      p.description as string,
      p.role ? `Role: ${p.role}` : "",
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
      description: descParts.join("\n\n").slice(0, 2000),
      skills: [...new Set(skills)].slice(0, 20),
      images: images.slice(0, 20),
    };
  });
}

document.addEventListener("mf-get-projects", () => {
  let payload = "[]";
  try { payload = JSON.stringify(extractProjects()); } catch { payload = "[]"; }
  document.dispatchEvent(new CustomEvent("mf-projects", { detail: payload }));
});
