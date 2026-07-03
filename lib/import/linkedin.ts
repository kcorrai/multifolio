// LinkedIn profil içe aktarma istemcisi. Bionluk'un aksine JSON API yok; LinkedIn
// public profil sayfası (`/in/{username}`) HTML'ine gömülü JSON-LD (`@graph`) TAM
// YAPILANDIRILMIŞ profil verisi taşır: name/jobTitle/description(headline tagline)/
// worksFor(şirketler)/alumniOf(okullar)/address(konum)/image(FOTOĞRAF). Skills public
// ld+json'da YOK. Tarayıcı-UA'lı düz sunucu fetch'i (2026-07-03 doğrulandı) — bot
// duvarı düşmüş; kullanıcı KENDİ URL'ini bir kez yapıştırır (on-demand tek profil),
// hacim riski düşük. fetch() ağ yapar; normalize* saf/test edilebilir (Bionluk deseni).
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

/** linkedin.com/in/{username}'den kullanıcı adını çıkarır (yoksa/geçersizse null). */
export function parseLinkedinUsername(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)linkedin\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  // Profil yolu yalnız /in/{username} (locale alt alan adları host'ta ele alınır).
  if (segments.length !== 2 || segments[0].toLowerCase() !== "in") return null;
  const name = segments[1];
  if (!/^[A-Za-z0-9._%-]{2,100}$/.test(name)) return null;
  return name;
}

export interface LinkedinProfile {
  username: string;
  draft: ProfileDraft; // headline / summary — doğrudan profile kaydedilebilir (skills boş)
  avatarUrl: string | null;
}

// --- saf JSON-LD yardımcıları ---
type Json = Record<string, unknown>;

function toArray<T = unknown>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x === null || x === undefined) return [];
  return [x as T];
}

/** HTML'deki tüm application/ld+json bloklarından üst düzey Person düğümlerini toplar. */
function extractPersons(html: string): Json[] {
  const persons: Json[] = [];
  const blocks = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  for (const m of blocks) {
    let data: unknown;
    try { data = JSON.parse(m[1]); } catch { continue; }
    const nodes = toArray<Json>((data as Json)?.["@graph"] ?? data);
    for (const n of nodes) {
      if (n && typeof n === "object" && (n as Json)["@type"] === "Person") persons.push(n as Json);
    }
  }
  return persons;
}

/** Profil sahibi Person: önce URL/sameAs'ta /in/{username} eşleşeni, yoksa en zengini. */
function pickPerson(persons: Json[], username: string): Json | null {
  const needle = `/in/${username.toLowerCase()}`;
  const byUrl = persons.find((p) =>
    [...toArray(p.url), ...toArray(p.sameAs)]
      .map((x) => String(x).toLowerCase())
      .some((u) => u.includes(needle)),
  );
  if (byUrl) return byUrl;
  return persons.find((p) => p.jobTitle || p.worksFor || p.address) ?? persons[0] ?? null;
}

function personImage(image: unknown): string | null {
  const first = toArray(image)[0];
  const url =
    typeof first === "string" ? first
    : first && typeof first === "object" ? (first as Json).contentUrl
    : null;
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

function personLocation(address: unknown): string {
  const a = toArray<Json>(address)[0];
  if (!a || typeof a !== "object") return "";
  const locality = typeof a.addressLocality === "string" ? a.addressLocality.trim() : "";
  const country = typeof a.addressCountry === "string" ? a.addressCountry.trim() : "";
  return locality || country;
}

function orgNames(list: unknown): string[] {
  return toArray<Json>(list)
    .map((o) => (o && typeof o === "object" && typeof o.name === "string" ? o.name.trim() : ""))
    .filter(Boolean);
}

/** Ham HTML'i yapılandırılmış LinkedinProfile'a çevirir. Person yoksa null. */
export function normalizeLinkedinProfile(html: string, username: string): LinkedinProfile | null {
  const person = pickPerson(extractPersons(html), username);
  if (!person) return null;

  const jobTitles = toArray(person.jobTitle).map((s) => String(s).trim()).filter(Boolean);
  const description = typeof person.description === "string" ? person.description.trim() : "";
  const companies = orgNames(person.worksFor);
  const schools = orgNames(person.alumniOf);
  const location = personLocation(person.address);

  // headline ← ünvanlar (yoksa tagline); summary ← tagline + şirketler + okullar + konum.
  const headline = (jobTitles.join(" · ") || description).slice(0, 120);
  const summary = [description, companies.join(" · "), schools.join(" · "), location]
    .filter((s) => s.trim())
    .join("\n\n")
    .slice(0, 2000);

  if (!headline && !summary) return null; // anlamlı hiçbir alan yok

  return {
    username,
    draft: { headline, summary, skills: [] }, // LinkedIn public ld+json skills içermez
    avatarUrl: personImage(person.image),
  };
}

/** Kullanıcı adından public profili çeker. Profil ayrıştırılamazsa null döner. */
export async function fetchLinkedinProfile(username: string): Promise<LinkedinProfile | null> {
  const target = `https://www.linkedin.com/in/${encodeURIComponent(username)}`;
  const res = await fetch(target, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`LinkedIn HTTP ${res.status}`);
  // Güvenlik: yönlendirmelerden sonra bile son host linkedin.com içinde kalmalı.
  let finalHost = "";
  try { finalHost = new URL(res.url).hostname.toLowerCase(); } catch { throw new Error("bad_final_url"); }
  if (!/(^|\.)linkedin\.com$/.test(finalHost)) throw new Error("unexpected_host");

  return normalizeLinkedinProfile(await res.text(), username);
}
