// Contra public profil içe aktarma (contra.com/{username}).
//
// 2026-07-20 canlı ölçüm: sayfa tarayıcı-UA'lı düz sunucu fetch'iyle 200 dönüyor ve
// gömülü ld+json `@graph` içinde TAM bir `Person` düğümü taşıyor:
//   name / jobTitle (başlık cümlesi) / description (bio) / image (foto) /
//   address (şehir) / sameAs (dış linkler)
// Yani LinkedIn deseninin aynısı — hatta daha zengin (LinkedIn'de bio yok).
// robots.txt yalnız /@internal'i yasaklıyor; profil yolları serbest.
// Skills ld+json'da YOK (Contra beceri etiketlerini istemci tarafında render ediyor).
//
// fetch() ağ yapar; normalize* SAF ve test edilebilir (linkedin.ts deseni).
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";
import {
  extractJsonLdNodes,
  personNodes,
  personImage,
  personLocation,
  stripHtml,
  toArray,
} from "./ldjson";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

/** Contra kök yolunda profil-OLMAYAN bilinen sayfalar (yanlış pozitif engeli). */
const RESERVED = new Set([
  "discover", "search", "jobs", "opportunities", "hire", "for-clients", "for-independents",
  "login", "signup", "join", "settings", "account", "inbox", "messages", "notifications",
  "about", "blog", "help", "support", "terms", "privacy", "pricing", "product", "resources",
  "independents", "clients", "collections", "assets", "static", "image", "images", "api",
]);

/** contra.com/{username} → kullanıcı adı (profil değilse null). */
export function parseContraUsername(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)contra\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null; // /{username} — alt sayfalar profil değil
  const name = segments[0];
  if (!/^[A-Za-z0-9._-]{2,60}$/.test(name)) return null;
  if (RESERVED.has(name.toLowerCase())) return null;
  return name;
}

export interface ContraProfile {
  username: string;
  draft: ProfileDraft;
  avatarUrl: string | null;
}

/** Profil sahibi Person: URL/sameAs'ta /{username} eşleşeni, yoksa en zengini. */
function pickPerson(persons: ReturnType<typeof personNodes>, username: string) {
  const needle = `contra.com/${username.toLowerCase()}`;
  const byUrl = persons.find((p) =>
    [...toArray(p.url), ...toArray(p["@id"])]
      .map((x) => String(x).toLowerCase())
      .some((u) => u.includes(needle)),
  );
  return byUrl ?? persons.find((p) => p.jobTitle || p.description) ?? persons[0] ?? null;
}

/** Ham HTML → yapılandırılmış ContraProfile. Person yoksa null. */
export function normalizeContraProfile(html: string, username: string): ContraProfile | null {
  const person = pickPerson(personNodes(extractJsonLdNodes(html)), username);
  if (!person) return null;

  const jobTitle = typeof person.jobTitle === "string" ? stripHtml(person.jobTitle) : "";
  const description = typeof person.description === "string" ? stripHtml(person.description) : "";
  const name = typeof person.name === "string" ? person.name.trim() : "";
  const location = personLocation(person.address);

  // headline ← jobTitle (Contra'da "Helping growth-stage brands tell their story." gibi
  // bir değer önerisi cümlesi); yoksa bio'nun ilk cümlesine düş.
  const headline = (jobTitle || description.split(/(?<=[.!?])\s/)[0] || name).slice(0, 120);
  const summary = [description, location].filter((s) => s.trim()).join("\n\n").slice(0, 2000);

  if (!headline && !summary) return null;

  return {
    username,
    draft: { headline, summary, skills: [] }, // beceriler public ld+json'da yok
    avatarUrl: personImage(person.image),
  };
}

/** Kullanıcı adından public Contra profilini çeker; ayrıştırılamazsa null. */
export async function fetchContraProfile(username: string): Promise<ContraProfile | null> {
  const target = `https://contra.com/${encodeURIComponent(username)}`;
  const res = await fetch(target, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Contra HTTP ${res.status}`);
  // Güvenlik: yönlendirmelerden sonra bile son host contra.com içinde kalmalı.
  let finalHost = "";
  try { finalHost = new URL(res.url).hostname.toLowerCase(); } catch { throw new Error("bad_final_url"); }
  if (!/(^|\.)contra\.com$/.test(finalHost)) throw new Error("unexpected_host");

  return normalizeContraProfile(await res.text(), username);
}
