// İstihdam türü normalizasyonu (SAF — I/O yok, test edilebilir). Kaynaklar farklı
// yazımlar döner (Remotive "contract"/"full_time"; RemoteOK yalnız tags). Hepsini
// tek kanonik sete indirger. Tanınmayan/boş → null (filtre lenient: elenmez).

export const JOB_TYPES = ["full_time", "part_time", "contract", "freelance", "internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

const JOB_TYPE_SET = new Set<string>(JOB_TYPES);

// Ham etiketi kanonik anahtara götüren eşleme (normalize edilmiş: lowercase,
// boşluk/tire/alt-çizgi tek boşluğa indirilmiş).
const ALIASES: Record<string, JobType> = {
  "full time": "full_time",
  "fulltime": "full_time",
  "permanent": "full_time",
  "part time": "part_time",
  "parttime": "part_time",
  "contract": "contract",
  "contractor": "contract",
  "contract to hire": "contract",
  "temporary": "contract",
  "freelance": "freelance",
  "freelancer": "freelance",
  "internship": "internship",
  "intern": "internship",
};

function canonicalKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

/** Tek istihdam-türü etiketini kanonik JobType'a çevirir; tanınmazsa null. */
export function normalizeJobType(raw: string | null | undefined): JobType | null {
  if (!raw || typeof raw !== "string") return null;
  const key = canonicalKey(raw);
  if (!key) return null;
  if (JOB_TYPE_SET.has(key.replace(/ /g, "_"))) return key.replace(/ /g, "_") as JobType;
  return ALIASES[key] ?? null;
}

/** Ayrı job_type alanı olmayan kaynaklar (RemoteOK) için: tag listesinde tanınabilir
 *  bir istihdam türü ipucu ara. İlk eşleşen kanonik tür; yoksa null (varsayım yapma). */
export function inferJobTypeFromTags(tags: string[] | null | undefined): JobType | null {
  if (!tags) return null;
  for (const tag of tags) {
    const t = normalizeJobType(tag);
    if (t) return t;
  }
  return null;
}
