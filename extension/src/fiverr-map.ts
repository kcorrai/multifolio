// SAF Fiverr çıkarım yardımcıları — DOM'a dokunmaz, vitest ile test edilir.
// Fiverr profil sayfası tüm veriyi window.__PERSEUS__initialProps (JSON string) içinde
// tutar: seller.{oneLinerTitle,description,rating,sellerLevel,activeStructuredSkills,
// certifications,activeEducations,workExperiences,user...} + gigsData[] (başlık+görseller).
// fiverr.ts (MAIN world) bu modülü çağırır; content.ts sonucu köprüyle alır.

export interface FiverrImage { url: string; caption: string }
export interface FiverrProject {
  title: string;
  description: string;
  role: string;
  skills: string[];
  images: FiverrImage[];
}
export interface FiverrExtract {
  text: string; // AI çıkarımına verilecek TEMİZ yapılandırılmış blok
  avatarUrl: string; // seller.user.profileImageUrl
  skills: string[];
  projects: FiverrProject[]; // gig'ler (başlık + görsel + açıklama)
  images: string[]; // gig kapak görselleri (portfolyo görselleri content.ts'te DOM'dan eklenir)
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object";
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

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

// gigsData[] öğesini portfolyo projesine çevirir: başlık + metadata'dan açıklama +
// asset görselleri (cloud_img_main_gig). Video asset'ler atlanır (yalnız görsel).
function mapGig(g: Obj): FiverrProject | null {
  const title = str(g.title).slice(0, 200);
  const images: FiverrImage[] = [];
  const seen = new Set<string>();
  if (Array.isArray(g.assets)) {
    for (const a of g.assets as Obj[]) {
      const url = str(a?.cloud_img_main_gig);
      if (!url) continue; // VideoAsset vb.
      const key = fiverrImageKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      images.push({ url, caption: title });
    }
  }
  if (!title && !images.length) return null;

  // metadata: [{type:'programming_language', value:[...]}, ...] → açıklama + skills.
  const meta = Array.isArray(g.metadata) ? (g.metadata as Obj[]) : [];
  const metaVals = (type: RegExp): string[] => {
    const m = meta.find((x) => type.test(str(x?.type)));
    return Array.isArray(m?.value) ? (m!.value as unknown[]).map(str).filter(Boolean) : [];
  };
  const tech = metaVals(/programming_language|tech/i);
  const features = metaVals(/feature/i);
  const kinds = metaVals(/type/i);
  const price = num(g.price_i);
  const rating = num(g.buying_review_rating);
  const descParts = [
    kinds.length ? `Type: ${kinds.join(", ")}` : "",
    features.length ? `Features: ${features.join(", ").replace(/_/g, " ")}` : "",
    tech.length ? `Tech: ${tech.join(", ").replace(/_/g, " ")}` : "",
    price ? `Starting at $${price}` : "",
    rating ? `Rating ${rating}` : "",
  ].filter(Boolean);

  return {
    title,
    description: descParts.join(". ").slice(0, 1000),
    role: "",
    skills: [...new Set(tech.map((t) => t.replace(/_/g, " ")))].slice(0, 15),
    images: images.slice(0, 10),
  };
}

// __PERSEUS__initialProps (parse edilmiş) → yapılandırılmış Fiverr çıkarımı. Seller yoksa null.
export function mapFiverrProps(props: unknown): FiverrExtract | null {
  const root = isObj(props) ? props : null;
  const seller = root && isObj(root.seller) ? root.seller : null;
  if (!seller) return null;

  const user = isObj(seller.user) ? seller.user : {};
  const profile = isObj(user.profile) ? user.profile : {};
  const displayName = str(profile.displayName) || str(user.name);
  const headline = str(seller.oneLinerTitle);
  const description = str(seller.description);
  const avatarUrl = str(user.profileImageUrl);

  // Skills: activeStructuredSkills[].name
  const skills = (Array.isArray(seller.activeStructuredSkills) ? (seller.activeStructuredSkills as Obj[]) : [])
    .map((s) => str(s?.name))
    .filter(Boolean);

  // Gig'ler: yapılandırılmış proje verisi gigsData[]'da (görselli).
  const gigs = (Array.isArray(root!.gigsData) ? (root!.gigsData as Obj[]) : [])
    .map(mapGig)
    .filter((p): p is FiverrProject => !!p);

  const images = dedupeFiverrImages(gigs.flatMap((p) => p.images.map((i) => i.url)));

  // ── AI'a verilecek TEMİZ metin bloğu (DOM innerText'ten çok daha az gürültülü) ──
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
    gigs.length ? `Services / gigs:\n- ${gigs.map((g) => g.title).filter(Boolean).join("\n- ")}` : "",
  ].filter(Boolean);

  return {
    text: sections.join("\n\n").slice(0, 50_000),
    avatarUrl,
    skills: [...new Set(skills)].slice(0, 40),
    projects: gigs.slice(0, 30),
    images: images.slice(0, 50),
  };
}
