// Alt-proje B — scraper ortak tipleri. job_pool'a yazılan satır şekli ve
// pluggable kaynak adaptörü arayüzü. Kullanıcıya görünen metin YOK.

/** job_pool insert şekli (id/created_at DB üretir). PoolJobRow'un yazılabilir alt kümesi. */
export interface PoolJobUpsert {
  source: string;
  external_id: string;
  title: string;
  description: string;
  url: string | null;
  budget: string | null;
  skills: string[];
  client_country: string | null;
  client_spent: number | null;
  posted_at: string | null;
  // İstihdam türü (full_time/contract/freelance/part_time/internship); kaynak
  // vermezse/çıkarılamazsa null (filtre lenient — null olan ilan elenmez).
  job_type: string | null;
}

/** Bir ilan kaynağı: fetch() I/O yapar, normalize() saf dönüşümdür (test edilebilir). */
export interface ScrapeSource {
  id: string;
  /** Ham ilan objelerini döndürür; ağ/parse hatasında throw eder. */
  fetch(): Promise<unknown[]>;
  /** Tek ham objeyi PoolJobUpsert'e çevirir; geçersizse null (atlanır). */
  normalize(raw: unknown): PoolJobUpsert | null;
}

/** Tek kaynağın bir koşusunun özeti (scrape_runs satırıyla birebir). */
export interface ScrapeRunResult {
  source: string;
  fetched: number;
  upserted: number;
  skipped: number;
  error: string | null;
  ms: number;
}
