// GitHub profil içe aktarma istemcisi. GitHub = geliştiricinin fiili portfolyosu;
// resmî REST API (auth'suz 60/saat, GITHUB_TOKEN ile 5.000/saat) TAM yapılandırılmış
// veri verir → repo'lardan dil + topic'ler beceriye, öne çıkan (fork OLMAYAN) repo'lar
// PROJE'ye dönüşür. AI YOK — ücretsiz, kredisiz, daha doğru. Kullanıcı KENDİ URL'ini
// bir kez yapıştırır (on-demand). fetch() ağ yapar; normalize* saf/test edilebilir
// (Bionluk/LinkedIn deseni). NOT: GitHub bir uyarlama-hedefi PlatformId DEĞİL — yalnız
// portfolyo import kaynağı; platform_connections/platform_profiles'a yazılmaz.
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";
import type { ProfileProject } from "@/lib/validation/schemas/profile";

const API = "https://api.github.com";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_PROJECTS = 6; // öne çıkan repo → proje
const MAX_SKILLS = 15;

/** github.com/{username}'den kullanıcı adını çıkarır (repo/alt-yol yolları reddedilir). */
export function parseGithubUsername(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  // Yalnız profil yolu /{username} (repo /{user}/{repo}, /orgs/... vb. reddedilir).
  if (segments.length !== 1) return null;
  const name = segments[0];
  // GitHub kullanıcı adı kuralı: alfanumerik + tek tire, 1-39 karakter.
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(name)) return null;
  // Rezerve/işlevsel yollar profil değil.
  const reserved = new Set(["settings", "notifications", "explore", "marketplace", "sponsors", "features", "about", "pricing", "topics", "collections", "trending", "login", "join", "new"]);
  if (reserved.has(name.toLowerCase())) return null;
  return name;
}

export interface GithubProfile {
  username: string;
  draft: ProfileDraft; // headline / summary / skills — repo dil+topic'lerinden türetilir
  avatarUrl: string | null;
  projects: ProfileProject[]; // öne çıkan (fork olmayan) repo'lar
}

// --- saf yardımcılar ---
interface GhUser {
  login?: unknown; name?: unknown; bio?: unknown; company?: unknown;
  blog?: unknown; location?: unknown; avatar_url?: unknown;
  public_repos?: unknown; followers?: unknown;
}
interface GhRepo {
  name?: unknown; description?: unknown; language?: unknown;
  stargazers_count?: unknown; fork?: unknown; topics?: unknown; html_url?: unknown;
}

const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) ? x : 0);

/** Ham GitHub user + repos → yapılandırılmış GithubProfile. Geçersizse null. */
export function normalizeGithubProfile(rawUser: unknown, rawRepos: unknown, username: string): GithubProfile | null {
  if (!rawUser || typeof rawUser !== "object") return null;
  const user = rawUser as GhUser;
  const repos = (Array.isArray(rawRepos) ? rawRepos : []) as GhRepo[];

  // Yalnız ORİJİNAL repo'lar (fork'lar kullanıcının işi değil) → yıldıza göre sırala.
  const owned = repos
    .filter((r) => r.fork !== true && str(r.name))
    .sort((a, b) => num(b.stargazers_count) - num(a.stargazers_count));

  // Beceriler: repo dilleri + topic'ler, frekansa göre; diller önce.
  const langFreq = new Map<string, number>();
  const topicFreq = new Map<string, number>();
  for (const r of owned) {
    const lang = str(r.language);
    if (lang) langFreq.set(lang, (langFreq.get(lang) ?? 0) + 1);
    for (const tRaw of Array.isArray(r.topics) ? r.topics : []) {
      const topic = str(tRaw);
      if (topic && topic.length <= 40) topicFreq.set(topic, (topicFreq.get(topic) ?? 0) + 1);
    }
  }
  const byFreq = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const skills: string[] = [];
  for (const s of [...byFreq(langFreq), ...byFreq(topicFreq)]) {
    if (skills.length >= MAX_SKILLS) break;
    if (!skills.some((x) => x.toLowerCase() === s.toLowerCase())) skills.push(s);
  }

  // Öne çıkan repo'lar → projeler.
  const projects: ProfileProject[] = owned.slice(0, MAX_PROJECTS).map((r) => {
    const topics = (Array.isArray(r.topics) ? r.topics : []).map(str).filter(Boolean);
    const projSkills = [str(r.language), ...topics].filter(Boolean).slice(0, 12);
    return {
      title: str(r.name).slice(0, 200),
      description: str(r.description).slice(0, 4000),
      role: "",
      skills: projSkills,
      images: [],
      platform: "github",
    };
  });

  const name = str(user.name) || str(user.login) || username;
  const bio = str(user.bio);
  const topLang = byFreq(langFreq)[0] ?? "";

  // headline: bio (varsa) yoksa isim + baskın dil kimliği.
  const headline = (bio || `${name}${topLang ? ` · ${topLang} Developer` : " · Developer"}`).slice(0, 120);

  // summary: bio + şirket/konum + web + repo/takipçi sayısı + öne çıkan projeler.
  const stats: string[] = [];
  if (num(user.public_repos)) stats.push(`${num(user.public_repos)} public repos`);
  if (num(user.followers)) stats.push(`${num(user.followers)} followers`);
  const highlights = projects
    .filter((p) => p.description)
    .slice(0, 4)
    .map((p) => `• ${p.title} — ${p.description}`);
  const summary = [
    bio,
    [str(user.company), str(user.location)].filter(Boolean).join(" · "),
    str(user.blog),
    stats.join(" · "),
    highlights.length ? `Highlights:\n${highlights.join("\n")}` : "",
  ]
    .filter((s) => s.trim())
    .join("\n\n")
    .slice(0, 2000);

  if (!headline && !summary && skills.length === 0) return null;

  const avatar = str(user.avatar_url);
  return {
    username,
    draft: { headline, summary, skills },
    avatarUrl: /^https?:\/\//i.test(avatar) ? avatar : null,
    projects,
  };
}

/** Kullanıcı adından public profili + repo'ları çeker. Ayrıştırılamazsa null. */
export async function fetchGithubProfile(username: string): Promise<GithubProfile | null> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "MultifolioBot/1.0",
    "x-github-api-version": "2022-11-28",
  };
  // OPSİYONEL: token varsa rate-limit 60/saat → 5.000/saat (server-only env).
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  const opts = { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) };
  const [userRes, reposRes] = await Promise.all([
    fetch(`${API}/users/${encodeURIComponent(username)}`, opts),
    fetch(`${API}/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100`, opts),
  ]);
  if (!userRes.ok) throw new Error(`GitHub HTTP ${userRes.status}`);
  const user = await userRes.json();
  // Repo çağrısı patlarsa (rate-limit vb.) profil yine dönsün — repos boş kabul edilir.
  const repos = reposRes.ok ? await reposRes.json() : [];
  return normalizeGithubProfile(user, repos, username);
}
