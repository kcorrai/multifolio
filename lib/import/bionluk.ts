// Bionluk profil içe aktarma istemcisi. Bionluk bir Nuxt SPA; profil verisini
// public JSON API'sinden çeker. Diğer platformların (LinkedIn/Upwork/Fiverr)
// aksine bot duvarı YOK — sadece SPA'nın el sıkışmasını taklit etmek yeterli:
//   1) speed_init → anonim ziyaretçi session token'i (super-token)
//   2) get_public_profile → yapılandırılmış profil (foto, bio, başlık, skills…)
//   3) portfolio_get_all → portfolyo öğeleri (görsel URL'leri)
// super-key herkese açık JS bundle'ına gömülü SABİT istemci anahtarı (sır değil,
// her tarayıcı gönderir). fetch() ağ yapar; normalize* saf/test edilebilir.
import { z } from "zod";
import { htmlToText } from "./text";
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";

const BIONLUK_API = "https://bionluk.com/api";
const BIONLUK_SUPER_KEY = "1e291318-f4b6-4a65-8323-a1823dbd7564";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

// bionluk.com/{username} = profil. Bunlar kullanıcı adı DEĞİL, sistem path'leri.
const RESERVED_PATHS = new Set([
  "freelancer-vitrin", "freelancer-bul", "freelancer-olmak", "ilanlar", "destek",
  "kategori", "kategoriler", "search", "ara", "login", "register", "kayit", "giris",
  "api", "blog", "hakkimizda", "iletisim", "sss", "pro", "panel", "mesajlar",
]);

/** Bionluk profil URL'inden kullanıcı adını çıkarır (yoksa/geçersizse null). */
export function parseBionlukUsername(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)bionluk\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null; // yalnız /{username}
  const name = segments[0];
  if (RESERVED_PATHS.has(name.toLowerCase())) return null;
  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(name)) return null;
  return name;
}

// --- API yanıt şemaları (yalnız kullandığımız alanlar; fazlası yok sayılır) ---
const publicProfileSchema = z.object({
  data: z.object({
    user: z.object({
      username: z.string(),
      avatar_url: z.string().nullable().optional(),
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      seller_skills: z.array(z.object({ name: z.string() })).optional(),
      sellerRating: z
        .object({
          commentCount: z.number().nullable().optional(),
          commentRating: z.number().nullable().optional(),
        })
        .optional(),
      user_created_at: z.string().nullable().optional(),
    }),
  }),
});

const portfolioSchema = z.object({
  data: z
    .object({
      portfolios: z
        .array(
          z.object({
            name: z.string().nullable().optional(),
            description: z.string().nullable().optional(),
            image_url: z.string().nullable().optional(),
            image_url_small: z.string().nullable().optional(),
            category_name: z.string().nullable().optional(),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
});

export interface BionlukPortfolioItem {
  title: string;
  description: string;
  imageUrl: string | null;
  category: string | null;
}

export interface BionlukProfile {
  username: string;
  draft: ProfileDraft; // headline / summary / skills — doğrudan profile kaydedilebilir
  avatarUrl: string | null;
  portfolio: BionlukPortfolioItem[];
  rating: { count: number; average: number } | null;
  memberSince: string | null;
}

/** Ham API yanıtlarını normalleştirir. Profil ayrıştırılamazsa null (atlanır). */
export function normalizeBionlukProfile(
  rawProfile: unknown,
  rawPortfolio: unknown,
): BionlukProfile | null {
  const parsed = publicProfileSchema.safeParse(rawProfile);
  if (!parsed.success) return null;
  const u = parsed.data.data.user;

  const draft: ProfileDraft = {
    headline: (u.title ?? "").trim().slice(0, 120),
    summary: htmlToText(u.description ?? "").slice(0, 2000),
    skills: (u.seller_skills ?? [])
      .map((s) => s.name.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 50),
  };

  const portfolio: BionlukPortfolioItem[] = [];
  const pf = portfolioSchema.safeParse(rawPortfolio);
  if (pf.success) {
    for (const item of pf.data.data?.portfolios ?? []) {
      portfolio.push({
        title: (item.name ?? "").trim(),
        description: htmlToText(item.description ?? "").slice(0, 500),
        imageUrl: item.image_url ?? item.image_url_small ?? null,
        category: item.category_name ?? null,
      });
    }
  }

  const count = u.sellerRating?.commentCount ?? 0;
  const rating = count > 0 ? { count, average: u.sellerRating?.commentRating ?? 0 } : null;

  return {
    username: u.username,
    draft,
    avatarUrl: u.avatar_url ?? null,
    portfolio,
    rating,
    memberSince: u.user_created_at ?? null,
  };
}

function bionlukHeaders(token: string | null, referer: string): HeadersInit {
  return {
    "user-agent": UA,
    accept: "application/json",
    "super-key": BIONLUK_SUPER_KEY,
    origin: "https://bionluk.com",
    referer,
    ...(token ? { "super-token": token } : {}),
  };
}

/** Anonim ziyaretçi session token'i (super-token) alır. */
async function bionlukInit(): Promise<string | null> {
  const res = await fetch(`${BIONLUK_API}/users/speed_init/`, {
    method: "POST",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: bionlukHeaders(null, "https://bionluk.com/"),
  });
  if (!res.ok) throw new Error(`Bionluk speed_init HTTP ${res.status}`);
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

async function bionlukPost(path: string, token: string | null, username: string): Promise<unknown> {
  const form = new FormData();
  form.append("username", username);
  const res = await fetch(`${BIONLUK_API}/${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: bionlukHeaders(token, `https://bionluk.com/${username}`),
    body: form,
  });
  if (!res.ok) throw new Error(`Bionluk ${path} HTTP ${res.status}`);
  return res.json();
}

/** Kullanıcı adından tam profili çeker. Profil yoksa null döner. */
export async function fetchBionlukProfile(username: string): Promise<BionlukProfile | null> {
  const token = await bionlukInit();
  const rawProfile = await bionlukPost("general/get_public_profile/", token, username);
  // Portfolyo best-effort: patlarsa/yoksa profil yine döner.
  let rawPortfolio: unknown = null;
  try {
    rawPortfolio = await bionlukPost("seller/portfolio_get_all/", token, username);
  } catch {
    rawPortfolio = null;
  }
  return normalizeBionlukProfile(rawProfile, rawPortfolio);
}
