// SAF Fiverr çıkarım yardımcıları — DOM'a dokunmaz, vitest ile test edilir.
// İki veri kaynağı:
//  1) window.__PERSEUS__initialProps (JSON): seller profili (headline/summary/skills/
//     rating/level/dil/eğitim/sertifika/iş-deneyimi) + gigsData[] (hizmet ilanları).
//     → mapFiverrProps: AI'a verilecek TEMİZ metin bloğu + avatar + skills.
//  2) /portfolio/api/sellers/{u}/portfolio yanıtı (lazy; fiverr.ts hook'lar/fetch'ler):
//     gerçek PROJELER (portföy) — başlık + görseller + açıklama + etiketler.
//     → portfolioProjectsFromResponse + rawToProject.
// Gig'ler PROJE değildir (hizmet ilanı) → yalnız metin sinyali olarak eklenir.

export interface FiverrImage { url: string; caption: string }
export interface FiverrProject {
  title: string;
  description: string;
  role: string;
  skills: string[];
  images: FiverrImage[];
}
// mapFiverrProps çıktısı (profil kısmı; projeler portföyden ayrı gelir).
export interface FiverrProfile {
  text: string; // AI çıkarımına verilecek temiz yapılandırılmış blok
  avatarUrl: string;
  skills: string[];
}
// content.ts'e köprüyle giden birleşik çıktı (fiverr.ts assemble eder).
export interface FiverrExtract extends FiverrProfile {
  projects: FiverrProject[]; // portföy projeleri
  images: string[]; // portföy görselleri
}
// Portföy projesinin ara (merge edilebilir) hâli — id ile tekilleştirilir; detailed=firstProject.
export interface PortfolioProjectRaw {
  id: string;
  title: string;
  description: string;
  skills: string[];
  images: FiverrImage[];
  detailed: boolean;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object";
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && isFinite(Number(v))) return Number(v);
  return null;
};

// Cloudinary dönüşüm/versiyon segmentlerini eleyerek görseli KİMLİĞİNE indirger:
// aynı görselin farklı thumbnail biçimleri (t_portfolio_project_card vs _grid, t_main1…)
// tek anahtara toplanır → çift görsel önlenir. (Upwork'teki URL-desen dedup'ının Fiverr karşılığı.)
export function fiverrImageKey(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname
      .split("/")
      .filter(Boolean)
      .filter(
        (s) =>
          !/,/.test(s) && // zincirli dönüşüm (f_auto,q_auto,t_…)
          !/^v\d+$/.test(s) && // versiyon (v1)
          !/^(t_|f_|q_|so_|w_|h_|c_|e_|g_|b_|dpr_)/.test(s), // tekil dönüşüm token'ları
      );
    return segs.join("/");
  } catch {
    return url;
  }
}

// Fiverr görsel URL adaylarını kimliğe göre tekilleştirir (ilk görülen URL korunur).
export function dedupeFiverrImages(urls: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const url = (raw ?? "").trim();
    if (!/^https:\/\//i.test(url)) continue;
    const key = fiverrImageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

// Dil seviyesi kodunu okunur etikete çevirir (NATIVE_OR_BILINGUAL → Native).
function langLevel(level: unknown): string {
  const l = str(level).toUpperCase();
  if (/NATIVE|BILINGUAL/.test(l)) return "Native";
  if (/FLUENT/.test(l)) return "Fluent";
  if (/CONVERS/.test(l)) return "Conversational";
  if (/BASIC/.test(l)) return "Basic";
  return "";
}

// Fiverr süre enum'u → okunur (ONE_TO_THREE_MONTHS → "1-3 months").
function humanDuration(d: string): string {
  const map: Record<string, string> = {
    LESS_THAN_ONE_MONTH: "under 1 month",
    ONE_TO_THREE_MONTHS: "1-3 months",
    THREE_TO_SIX_MONTHS: "3-6 months",
    MORE_THAN_SIX_MONTHS: "6+ months",
  };
  return map[d] || d.replace(/_/g, " ").toLowerCase();
}

// ── Portföy (gerçek projeler) ──

// Bir portföy proje objesindeki tüm görsel previewUrl'lerini toplar (video posteri dahil).
function projectImages(node: Obj, caption: string): FiverrImage[] {
  const items = isObj(node.items) && Array.isArray(node.items.nodes) ? (node.items.nodes as Obj[]) : [];
  const out: FiverrImage[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const url = isObj(it?.attachment) ? str(it.attachment.previewUrl) : "";
    if (!/^https:\/\//i.test(url)) continue;
    const key = fiverrImageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url, caption });
  }
  return out;
}

// firstProject (tam detaylı) → PortfolioProjectRaw: açıklama + etiketler + süre/bütçe/yıl.
function mapDetailedProject(fp: Obj): PortfolioProjectRaw | null {
  const id = str(fp.id);
  const title = str(fp.title).slice(0, 200);
  if (!id && !title) return null;
  const skills = (Array.isArray(fp.industries) ? (fp.industries as Obj[]) : [])
    .map((i) => str(i?.name))
    .filter(Boolean);
  const duration = str(fp.duration);
  const price = num(isObj(fp.price) ? fp.price.amount : null);
  const startedYear = num(fp.projectStartedAt);
  const metaLine = [
    duration ? `Duration: ${humanDuration(duration)}` : "",
    price ? `Budget: $${Math.round(price)}` : "",
    startedYear ? `Started ${new Date(startedYear * 1000).getUTCFullYear()}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const description = [str(fp.description), metaLine].filter(Boolean).join("\n\n").slice(0, 4000);
  return { id, title, description, skills: [...new Set(skills)].slice(0, 15), images: projectImages(fp, title), detailed: true };
}

// Liste öğesi (sığ) → PortfolioProjectRaw: başlık + kapak görseli (açıklama/etiket yok).
function mapListProject(p: Obj): PortfolioProjectRaw | null {
  const id = str(p.id);
  const title = str(p.title).slice(0, 200);
  if (!id && !title) return null;
  return { id, title, description: "", skills: [], images: projectImages(p, title), detailed: false };
}

// Bir obje tek bir portföy projesine benziyor mu (başlık + görsel düğümleri)?
function looksLikeProject(o: unknown): o is Obj {
  return isObj(o) && typeof o.title === "string" && isObj(o.items) && Array.isArray(o.items.nodes);
}

// Portföy API yanıtından proje kayıtlarını çıkarır. İki yanıt biçimini de tanır:
//  • LİSTE: {projects:[sığ], firstProject:{derin}, totalProjects}
//  • DETAY (per-proje /portfolio/{id}): tek proje objesi (root veya root.project/firstProject).
// Aynı proje iki kez görünebilir (id ile merge çağıranın işi — mergePortfolio).
export function portfolioProjectsFromResponse(json: unknown): PortfolioProjectRaw[] {
  const root = isObj(json) ? json : null;
  if (!root) return [];
  const out: PortfolioProjectRaw[] = [];
  for (const p of Array.isArray(root.projects) ? (root.projects as Obj[]) : []) {
    const m = mapListProject(p);
    if (m) out.push(m);
  }
  // Derin proje adayları: liste'nin firstProject'i VEYA detay yanıtının kendisi/sarmalı.
  for (const cand of [root.firstProject, root.project, root]) {
    if (looksLikeProject(cand)) {
      const d = mapDetailedProject(cand);
      if (d) out.push(d);
    }
  }
  return out;
}

// Yeni kayıtları id bazında biriktirir; daha ZENGİN sürüm (detailed / daha çok görsel) kazanır.
export function mergePortfolio(store: Map<string, PortfolioProjectRaw>, incoming: PortfolioProjectRaw[]): void {
  for (const p of incoming) {
    const key = p.id || p.title;
    if (!key) continue;
    const prev = store.get(key);
    if (!prev) { store.set(key, p); continue; }
    const better = (p.detailed && !prev.detailed) || p.images.length > prev.images.length || p.description.length > prev.description.length;
    if (better) store.set(key, p);
  }
}

// PortfolioProjectRaw → sunucuya gidecek FiverrProject (id atılır).
export function rawToProject(r: PortfolioProjectRaw): FiverrProject {
  return { title: r.title, description: r.description, role: "", skills: r.skills, images: r.images.slice(0, 20) };
}

// __PERSEUS__initialProps (parse edilmiş) → profil kısmı (metin + avatar + skills). Seller yoksa null.
// Projeler portföyden ayrı gelir (bkz portfolioProjectsFromResponse).
export function mapFiverrProps(props: unknown): FiverrProfile | null {
  const root = isObj(props) ? props : null;
  const seller = root && isObj(root.seller) ? root.seller : null;
  if (!seller) return null;

  const user = isObj(seller.user) ? seller.user : {};
  const profile = isObj(user.profile) ? user.profile : {};
  const displayName = str(profile.displayName) || str(user.name);
  const headline = str(seller.oneLinerTitle);
  const description = str(seller.description);
  const avatarUrl = str(user.profileImageUrl);

  const skills = (Array.isArray(seller.activeStructuredSkills) ? (seller.activeStructuredSkills as Obj[]) : [])
    .map((s) => str(s?.name))
    .filter(Boolean);

  const rating = isObj(seller.rating) ? seller.rating : {};
  const ratingScore = num(rating.score);
  const ratingCount = num(rating.count);
  const level = str(seller.sellerLevel).replace(/_/g, " ").toLowerCase();
  const respHours = isObj(seller.responseTime) ? num(seller.responseTime.inHours) : null;
  const hourly = isObj(seller.hourlyRate) ? num(seller.hourlyRate.priceInCents) : null;

  const languages = (Array.isArray(user.languages) ? (user.languages as Obj[]) : [])
    .map((l) => {
      const lvl = langLevel(l?.level);
      return str(l?.code) ? `${str(l.code).toUpperCase()}${lvl ? ` (${lvl})` : ""}` : "";
    })
    .filter(Boolean);

  const educations = (Array.isArray(seller.activeEducations) ? (seller.activeEducations as Obj[]) : [])
    .map((e) => {
      const parts = [str(e?.degreeTitle), str(e?.degree)].filter(Boolean).join(" ");
      const yr = num(e?.toYear);
      return [parts, str(e?.school), yr ? `(${yr})` : ""].filter(Boolean).join(" — ");
    })
    .filter(Boolean);

  const certifications = (Array.isArray(seller.certifications) ? (seller.certifications as Obj[]) : [])
    .map((c) => {
      const yr = num(c?.year);
      return [str(c?.certificationName), str(c?.receivedFrom), yr ? `(${yr})` : ""].filter(Boolean).join(" — ");
    })
    .filter(Boolean);

  const work = (isObj(seller.workExperiences) && Array.isArray(seller.workExperiences.nodes)
    ? (seller.workExperiences.nodes as Obj[])
    : []
  )
    .map((w) => {
      const company = isObj(w?.company) ? str(w.company.name) : "";
      const line = [str(w?.title), company].filter(Boolean).join(" @ ");
      const d = str(w?.description);
      return line ? `${line}${d ? `: ${d}` : ""}` : "";
    })
    .filter(Boolean);

  const gigTitles = (Array.isArray(root!.gigsData) ? (root!.gigsData as Obj[]) : [])
    .map((g) => str(g?.title))
    .filter(Boolean);

  const summaryLine = [
    level ? `Fiverr seller level: ${level}` : "",
    ratingScore ? `Rating: ${ratingScore}${ratingCount ? ` (${ratingCount} reviews)` : ""}` : "",
    respHours ? `Response time: ${respHours}h` : "",
    hourly ? `Hourly rate: $${Math.round(hourly / 100)}` : "",
  ].filter(Boolean);

  const sections = [
    displayName,
    headline ? `Headline: ${headline}` : "",
    description,
    summaryLine.length ? summaryLine.join(" · ") : "",
    skills.length ? `Skills: ${skills.join(", ")}` : "",
    languages.length ? `Languages: ${languages.join(", ")}` : "",
    educations.length ? `Education:\n- ${educations.join("\n- ")}` : "",
    certifications.length ? `Certifications:\n- ${certifications.join("\n- ")}` : "",
    work.length ? `Work experience:\n- ${work.join("\n- ")}` : "",
    gigTitles.length ? `Services / gigs:\n- ${gigTitles.join("\n- ")}` : "",
  ].filter(Boolean);

  return {
    text: sections.join("\n\n").slice(0, 50_000),
    avatarUrl,
    skills: [...new Set(skills)].slice(0, 40),
  };
}
