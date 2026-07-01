# İş Feed Dashboard (Alt-proje A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** uphunt tarzı iş keşif deneyimini (Feed · Search · Starred · Applied) Multifolio'nun tasarım diline uyarlayarak, seed veriyle tam çalışan bir uygulama-içi dashboard olarak kurmak.

**Architecture:** Çekilen ilanlar paylaşımlı `job_pool` tablosunda yaşar (sadece service-role yazar, tüm authenticated kullanıcılar okur). Dashboard `job_pool`'u okur; kullanıcı başına `job_feeds` (kayıtlı arama), `starred_jobs`, `job_scores` (on-demand AI skor cache) tabloları vardır. Canlı çekme (Alt-proje B) ayrıktır; bu spec seed verisiyle çalışır. "Apply" = Upwork deep-link + mevcut `job_listings` pipeline'ına köprü.

**Tech Stack:** Next.js (App Router, TS), Supabase (Postgres + RLS, `@supabase/ssr`), OpenAI `gpt-4o-mini` (mevcut `match.ts`), next-intl (cookie i18n), Zod, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- **Üç sütun (pazarlık yok):** her API route `withErrorHandler`'dan geçer; her dış girdi Zod ile doğrulanır (`parseJson`/`parseQuery`); her tabloda RLS; `service-role` (`lib/supabase/admin.ts`) asla istemciye import edilmez; portfolyo/pool metni render öncesi metin olarak (HTML değil) gösterilir.
- **i18n:** kullanıcıya görünen TÜM metin `messages/{en,tr}.json`'da; sabit string yok; `useTranslations`/`getTranslations`. Yeni anahtar → iki katalog da güncellenir (anahtar setleri eşit; `messages/catalog.test.ts` doğrular). **Kod yorumları Türkçe.**
- **Kredi ekonomisi:** AI skorlama `spendCredits(userId, "job_match", work)` ile 1 kredi; maliyet `usage_events`'e admin ile yazılır; skor `job_scores`'a cache'lenir; cache varsa kredi harcanmaz.
- **Route-split desen:** her dashboard sekmesi kendi veri dilimini sunucuda çeker → client bileşene iletir.
- **AI çıktı dili:** `getUserLocale()` okunur, `matchJobToProfile(..., locale)`'e geçilir.
- **Migration numarası:** son uygulanan `0011`; yeni migration `0012`.
- **`npm run check`** (lint + `tsc --noEmit` + vitest) her task sonunda temiz olmalı.
- **Kabuk PowerShell:** komut örnekleri hem PowerShell hem Bash tool'da çalışır (git/npm nötr).

---

## Dosya haritası

**Oluşturulacak:**
- `supabase/migrations/0012_job_feed.sql` — 4 tablo + `job_listings.source_pool_id` + RLS + indeksler
- `supabase/seed/job_pool_sample.sql` — örnek pool ilanları (`source='sample'`)
- `lib/validation/schemas/feed.ts` — Zod şemaları + tipler (PoolJob, JobFeed, kriterler)
- `lib/feed/filter.ts` — saf yardımcılar (`extractBudgetFloor`, `matchesFeed`, `searchPool`)
- `lib/feed/filter.test.ts` — saf yardımcı testleri
- `lib/validation/schemas/feed.test.ts` — şema testleri
- `app/api/feed/route.ts` — GET (feed'e uyan pool + star + skor)
- `app/api/feed/search/route.ts` — GET (pool arama)
- `app/api/feed/[poolId]/score/route.ts` — POST (on-demand skor)
- `app/api/feeds/route.ts` — GET/POST (kayıtlı feed CRUD)
- `app/api/feeds/[id]/route.ts` — PATCH/DELETE
- `app/api/starred/route.ts` — GET/POST/DELETE
- `components/dashboard/pool-job-row.tsx` — pool ilan satırı (paylaşılan)
- `components/dashboard/pool-job-panel.tsx` — pool ilan detay paneli
- `components/dashboard/feed-view.tsx` — Feed görünümü
- `components/dashboard/search-view.tsx` — Search görünümü
- `components/dashboard/starred-view.tsx` — Starred görünümü
- `components/dashboard/applied-view.tsx` — mevcut `jobs-tab` içeriğinin taşındığı Applied görünümü
- `components/dashboard/feed-modal.tsx` — feed oluştur/düzenle

**Değiştirilecek:**
- `lib/validation/schemas/job.ts` — `jobCreateSchema`'ya opsiyonel `source_pool_id`
- `components/dashboard/jobs-tab.tsx` — segmented kabuk (Feed/Search/Starred/Applied)
- `components/dashboard/shared.tsx` — `PoolJob` tipi + `formatRelativeTime` yardımcı
- `app/dashboard/jobs/page.tsx` — feed'ler + ilk pool dilimi + starred/score haritaları çeker
- `messages/en.json`, `messages/tr.json` — `feed` namespace + `errors` anahtarları
- `CLAUDE.md` — "Neyin nerede"; `docs/ROADMAP.md` — Faz kaydı

---

## Task 1: DB migration + seed

**Files:**
- Create: `supabase/migrations/0012_job_feed.sql`
- Create: `supabase/seed/job_pool_sample.sql`

**Interfaces:**
- Produces: tablolar `job_pool`, `job_feeds`, `starred_jobs`, `job_scores`; kolon `job_listings.source_pool_id`.

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0012_job_feed.sql`:

```sql
-- Multifolio — Alt-proje A: iş feed dashboard (job_pool + feed/starred/score).
-- job_pool PAYLAŞIMLI havuzdur (kullanıcıya özel değil): tüm authenticated
-- kullanıcılar okur, yalnız service-role (scraper) yazar.

-- 1) Paylaşımlı ilan havuzu
create table if not exists public.job_pool (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  external_id    text not null,
  title          text not null,
  description    text not null,
  url            text,
  budget         text,
  skills         text[] not null default '{}',
  client_country text,
  posted_at      timestamptz,
  raw            jsonb,
  created_at     timestamptz not null default now(),
  constraint job_pool_source_external_uniq unique (source, external_id)
);

create index if not exists job_pool_posted_at_idx on public.job_pool (posted_at desc nulls last);
create index if not exists job_pool_skills_gin_idx on public.job_pool using gin (skills);

alter table public.job_pool enable row level security;

-- Paylaşımlı okuma: her authenticated kullanıcı görür. Yazma yalnız service-role
-- (RLS'i bypass eder); bilinçli olarak insert/update/delete politikası TANIMLANMAZ.
drop policy if exists "job_pool_select_auth" on public.job_pool;
create policy "job_pool_select_auth"
  on public.job_pool for select
  to authenticated
  using (true);

-- 2) Kayıtlı feed'ler (kullanıcı aramaları)
create table if not exists public.job_feeds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  keywords   text[] not null default '{}',
  min_budget int,
  platform   text,
  created_at timestamptz not null default now()
);

create index if not exists job_feeds_user_id_idx on public.job_feeds (user_id, created_at desc);

alter table public.job_feeds enable row level security;

drop policy if exists "job_feeds_all_own" on public.job_feeds;
create policy "job_feeds_all_own"
  on public.job_feeds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Yıldızlar
create table if not exists public.starred_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint starred_jobs_user_pool_uniq unique (user_id, job_pool_id)
);

create index if not exists starred_jobs_user_idx on public.starred_jobs (user_id, created_at desc);

alter table public.starred_jobs enable row level security;

drop policy if exists "starred_jobs_all_own" on public.starred_jobs;
create policy "starred_jobs_all_own"
  on public.starred_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) On-demand AI skor cache (kullanıcı × pool ilanı)
create table if not exists public.job_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  score       smallint not null,
  result      jsonb not null,
  created_at  timestamptz not null default now(),
  constraint job_scores_user_pool_uniq unique (user_id, job_pool_id)
);

create index if not exists job_scores_user_idx on public.job_scores (user_id);

alter table public.job_scores enable row level security;

-- Kullanıcı kendi skorlarını okur; yazımı score route'u service-role ile yapar.
drop policy if exists "job_scores_select_own" on public.job_scores;
create policy "job_scores_select_own"
  on public.job_scores for select
  using (auth.uid() = user_id);

-- 5) Applied köprüsü: pool ilanından oluşan iş, kaynağını işaret eder.
alter table public.job_listings
  add column if not exists source_pool_id uuid references public.job_pool (id) on delete set null;
```

- [ ] **Step 2: Seed dosyasını yaz**

`supabase/seed/job_pool_sample.sql` (Alt-proje B gelene kadar dashboard'u besler; prod'da `delete from job_pool where source='sample'` ile temizlenir):

```sql
-- Örnek pool ilanları (source='sample'). Prod'da temizlenir.
-- external_id çakışmasını önlemek için sabit 'sample-N' kullanılır.
insert into public.job_pool (source, external_id, title, description, url, budget, skills, client_country, posted_at)
values
  ('sample','sample-1','React dashboard for SaaS analytics',
   'We need a senior React/TypeScript developer to build a responsive analytics dashboard with charts, filters and CSV export. Existing REST API. ~3 weeks.',
   'https://www.upwork.com/jobs/~sample1','$1,500-3,000',
   array['React','TypeScript','Tailwind','Charts'],'United States', now() - interval '15 minutes'),
  ('sample','sample-2','Next.js marketing site + CMS',
   'Build a fast marketing website in Next.js with a headless CMS. SEO, i18n (EN/TR), dark mode. Design in Figma provided.',
   'https://www.upwork.com/jobs/~sample2','$800-1,500',
   array['Next.js','SEO','i18n','Figma'],'Germany', now() - interval '1 hour'),
  ('sample','sample-3','Supabase + Postgres backend for mobile app',
   'Design Postgres schema, RLS policies and edge functions on Supabase for a fitness app. Auth, storage, realtime.',
   'https://www.upwork.com/jobs/~sample3','Hourly $40-70',
   array['Supabase','Postgres','RLS','Auth'],'United Kingdom', now() - interval '3 hours'),
  ('sample','sample-4','AI proposal generator (OpenAI) integration',
   'Integrate OpenAI to generate tailored proposals from a user profile and a job description. Node/TS backend.',
   'https://www.upwork.com/jobs/~sample4','$500-1,000',
   array['OpenAI','Node.js','TypeScript','API'],'Canada', now() - interval '5 hours'),
  ('sample','sample-5','Landing page conversion optimization',
   'Improve conversion on an existing landing page. A/B test hero, pricing and CTA. Tailwind + Framer Motion.',
   'https://www.upwork.com/jobs/~sample5','$300-600',
   array['Tailwind','CRO','A/B Testing'],'Australia', now() - interval '8 hours'),
  ('sample','sample-6','Stripe billing + credits system',
   'Implement pay-as-you-go credits with Stripe. Webhooks, idempotency, refunds. Postgres ledger.',
   'https://www.upwork.com/jobs/~sample6','$1,000-2,000',
   array['Stripe','Postgres','Webhooks','Billing'],'Netherlands', now() - interval '1 day'),
  ('sample','sample-7','Vue 3 component library',
   'Build a reusable Vue 3 + TypeScript component library with Storybook and unit tests.',
   'https://www.upwork.com/jobs/~sample7','$1,200-2,500',
   array['Vue','TypeScript','Storybook','Testing'],'France', now() - interval '2 days'),
  ('sample','sample-8','WordPress to Next.js migration',
   'Migrate a content-heavy WordPress blog to Next.js with ISR. Preserve SEO and redirects.',
   'https://www.upwork.com/jobs/~sample8','$2,000-4,000',
   array['Next.js','WordPress','SEO','Migration'],'Sweden', now() - interval '3 days')
on conflict (source, external_id) do nothing;
```

- [ ] **Step 3: Migration'ı uygula (yerelde) ve doğrula**

Uygulama: `npx supabase db push` (bağlı proje varsa) veya Supabase SQL Editor'a `0012_job_feed.sql` yapıştır. Ardından seed'i çalıştır (SQL Editor'a `job_pool_sample.sql`).

Doğrulama sorgusu (SQL Editor):
```sql
select count(*) from public.job_pool where source='sample';   -- 8
select column_name from information_schema.columns
  where table_name='job_listings' and column_name='source_pool_id';  -- 1 satır
```
Beklenen: pool 8 satır, `source_pool_id` mevcut.

> **Not:** Prod'a uygulama kullanıcı onayıyla yapılır (bkz. hafıza: migration'lar prod'a elle, dikkatle). Bu task yerel/staging doğrulaması içindir.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0012_job_feed.sql supabase/seed/job_pool_sample.sql
git commit -m "feat(feed): job_pool/feeds/starred/scores şeması + örnek seed (migration 0012)"
```

---

## Task 2: Zod şemaları + tipler

**Files:**
- Create: `lib/validation/schemas/feed.ts`
- Create: `lib/validation/schemas/feed.test.ts`
- Modify: `lib/validation/schemas/job.ts` (jobCreateSchema'ya `source_pool_id`)
- Modify: `components/dashboard/shared.tsx` (`PoolJob` tipi)

**Interfaces:**
- Produces: `PoolJobRow`, `PoolJob`, `JobFeedRow` tipleri; `feedCreateSchema`, `feedUpdateSchema`, `feedSearchQuerySchema`, `feedListQuerySchema`, `starToggleSchema`.

- [ ] **Step 1: Şema testini yaz**

`lib/validation/schemas/feed.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { feedCreateSchema, feedSearchQuerySchema, starToggleSchema } from "./feed";

describe("feedCreateSchema", () => {
  it("geçerli feed'i kabul eder", () => {
    const r = feedCreateSchema.safeParse({ name: "React işleri", keywords: ["react", "next"], minBudget: 500, platform: "upwork" });
    expect(r.success).toBe(true);
  });
  it("boş isim reddeder", () => {
    expect(feedCreateSchema.safeParse({ name: "", keywords: [] }).success).toBe(false);
  });
  it("en çok 10 keyword'e izin verir", () => {
    const keywords = Array.from({ length: 11 }, (_, i) => `k${i}`);
    expect(feedCreateSchema.safeParse({ name: "x", keywords }).success).toBe(false);
  });
});

describe("feedSearchQuerySchema", () => {
  it("query string'ten sayısal minBudget'e coerce eder", () => {
    const r = feedSearchQuerySchema.safeParse({ q: "react", minBudget: "500" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.minBudget).toBe(500);
  });
});

describe("starToggleSchema", () => {
  it("uuid olmayan jobPoolId reddeder", () => {
    expect(starToggleSchema.safeParse({ jobPoolId: "abc" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm run test -- feed`
Expected: FAIL — `Cannot find module './feed'`.

- [ ] **Step 3: Şema dosyasını yaz**

`lib/validation/schemas/feed.ts`:

```ts
import { z } from "zod";
import type { JobMatchResult } from "./job";

// Kayıtlı feed oluşturma/güncelleme
export const feedCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  keywords: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  minBudget: z.number().int().min(0).max(1_000_000).optional(),
  platform: z.string().trim().max(60).optional(),
});

export const feedUpdateSchema = feedCreateSchema.partial();

// Query: liste sayfalama
export const feedListQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

// Query: anlık arama
export const feedSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(60).optional(),
  minBudget: z.coerce.number().int().min(0).max(1_000_000).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

// Yıldız aç/kapa
export const starToggleSchema = z.object({
  jobPoolId: z.string().uuid(),
});

export type FeedCreate = z.infer<typeof feedCreateSchema>;
export type FeedUpdate = z.infer<typeof feedUpdateSchema>;

// job_pool satırı (DB şekli)
export interface PoolJobRow {
  id: string;
  source: string;
  external_id: string;
  title: string;
  description: string;
  url: string | null;
  budget: string | null;
  skills: string[];
  client_country: string | null;
  posted_at: string | null;
  created_at: string;
}

// job_feeds satırı
export interface JobFeedRow {
  id: string;
  name: string;
  keywords: string[];
  min_budget: number | null;
  platform: string | null;
  created_at: string;
}

// İstemciye dönen zenginleştirilmiş pool ilanı
export interface PoolJob extends PoolJobRow {
  isStarred: boolean;
  score: number | null;
  scoreResult: JobMatchResult | null;
}
```

- [ ] **Step 4: `jobCreateSchema`'yı genişlet**

`lib/validation/schemas/job.ts` içinde `jobCreateSchema`'ya alan ekle:

```ts
export const jobCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(60).optional(),
  description: z.string().trim().min(10).max(10000),
  url: z.string().url().max(2000).optional(),
  budget: z.string().trim().max(100).optional(),
  source_pool_id: z.string().uuid().optional(),
});
```

- [ ] **Step 5: `PoolJob` tipini shared'a re-export et**

`components/dashboard/shared.tsx` üstündeki tip import'una ekle (mevcut `import type { JobStatus, JobMatchResult } ...` satırının altına):

```ts
export type { PoolJob } from "@/lib/validation/schemas/feed";
```

- [ ] **Step 6: Testi çalıştır, geçtiğini gör**

Run: `npm run test -- feed`
Expected: PASS (3 describe blok).

- [ ] **Step 7: Commit**

```bash
git add lib/validation/schemas/feed.ts lib/validation/schemas/feed.test.ts lib/validation/schemas/job.ts components/dashboard/shared.tsx
git commit -m "feat(feed): feed/arama/yıldız Zod şemaları + PoolJob tipleri"
```

---

## Task 3: Saf filtre/arama yardımcıları

**Files:**
- Create: `lib/feed/filter.ts`
- Create: `lib/feed/filter.test.ts`

**Interfaces:**
- Consumes: `PoolJobRow` (Task 2).
- Produces: `extractBudgetFloor(text)`, `matchesFeed(pool, criteria)`, `searchPool(pool[], query)`.

- [ ] **Step 1: Testi yaz**

`lib/feed/filter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractBudgetFloor, matchesFeed, searchPool } from "./filter";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

function pool(partial: Partial<PoolJobRow>): PoolJobRow {
  return {
    id: "1", source: "sample", external_id: "e1", title: "React dev",
    description: "Build a dashboard", url: null, budget: "$1,500-3,000",
    skills: ["React", "TypeScript"], client_country: "US",
    posted_at: null, created_at: "2026-07-01T00:00:00Z", ...partial,
  };
}

describe("extractBudgetFloor", () => {
  it("ilk sayıyı (bin ayıracı dahil) çıkarır", () => {
    expect(extractBudgetFloor("$1,500-3,000")).toBe(1500);
    expect(extractBudgetFloor("Hourly $40-70")).toBe(40);
  });
  it("sayı yoksa null döner", () => {
    expect(extractBudgetFloor(null)).toBeNull();
    expect(extractBudgetFloor("Negotiable")).toBeNull();
  });
});

describe("matchesFeed", () => {
  it("keyword title/description/skills'te geçerse eşleşir (case-insensitive)", () => {
    expect(matchesFeed(pool({}), { keywords: ["react"], min_budget: null, platform: null })).toBe(true);
    expect(matchesFeed(pool({}), { keywords: ["vue"], min_budget: null, platform: null })).toBe(false);
  });
  it("keyword boşsa (kriter yok) eşleşir", () => {
    expect(matchesFeed(pool({}), { keywords: [], min_budget: null, platform: null })).toBe(true);
  });
  it("min_budget pool floor'undan büyükse elenir", () => {
    expect(matchesFeed(pool({ budget: "$300-600" }), { keywords: [], min_budget: 500, platform: null })).toBe(false);
    expect(matchesFeed(pool({ budget: "$300-600" }), { keywords: [], min_budget: 200, platform: null })).toBe(true);
  });
  it("platform eşleşmezse elenir (source ile karşılaştırır)", () => {
    expect(matchesFeed(pool({ source: "sample" }), { keywords: [], min_budget: null, platform: "upwork" })).toBe(false);
    expect(matchesFeed(pool({ source: "upwork" }), { keywords: [], min_budget: null, platform: "upwork" })).toBe(true);
  });
});

describe("searchPool", () => {
  const rows = [pool({ id: "a", title: "React dev" }), pool({ id: "b", title: "Vue dev", skills: ["Vue"] })];
  it("q title/skills'te ararsa filtreler", () => {
    expect(searchPool(rows, { q: "vue" }).map((r) => r.id)).toEqual(["b"]);
  });
  it("q boşsa hepsini döner", () => {
    expect(searchPool(rows, {}).length).toBe(2);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm run test -- filter`
Expected: FAIL — `Cannot find module './filter'`.

- [ ] **Step 3: Yardımcıları yaz**

`lib/feed/filter.ts`:

```ts
// Saf feed filtre/arama yardımcıları (sunucu+istemci ortak, test edilebilir).
// job_pool.budget serbest metin ("$1,500-3,000") olduğundan bütçe filtresi
// best-effort: metindeki ilk sayıyı floor kabul eder.
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

export interface FeedCriteria {
  keywords: string[];
  min_budget: number | null;
  platform: string | null;
}

/** Serbest bütçe metninden ilk sayıyı (bin ayıracı dahil) çıkarır; yoksa null. */
export function extractBudgetFloor(text: string | null): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** Pool ilanı verilen feed kriterine uyuyor mu? Boş kriter = eşleşir. */
export function matchesFeed(pool: PoolJobRow, c: FeedCriteria): boolean {
  if (c.platform && pool.source !== c.platform) return false;

  if (c.min_budget != null) {
    const floor = extractBudgetFloor(pool.budget);
    if (floor != null && floor < c.min_budget) return false;
  }

  if (c.keywords.length > 0) {
    const hay = `${pool.title} ${pool.description} ${pool.skills.join(" ")}`.toLowerCase();
    const hit = c.keywords.some((k) => hay.includes(k.toLowerCase()));
    if (!hit) return false;
  }
  return true;
}

export interface SearchQuery {
  q?: string;
  platform?: string;
  minBudget?: number;
}

/** Pool listesini anlık arama kriterine göre filtreler (saf). */
export function searchPool(rows: PoolJobRow[], query: SearchQuery): PoolJobRow[] {
  return rows.filter((row) =>
    matchesFeed(row, {
      keywords: query.q ? [query.q] : [],
      min_budget: query.minBudget ?? null,
      platform: query.platform ?? null,
    }),
  );
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm run test -- filter`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/feed/filter.ts lib/feed/filter.test.ts
git commit -m "feat(feed): saf filtre/arama yardımcıları (bütçe floor, matchesFeed, searchPool)"
```

---

## Task 4: GET /api/feed

**Files:**
- Create: `app/api/feed/route.ts`

**Interfaces:**
- Consumes: `matchesFeed` (Task 3), `feedListQuerySchema`, `PoolJob`/`PoolJobRow`/`JobFeedRow` (Task 2).
- Produces: `GET /api/feed?offset&limit` → `{ jobs: PoolJob[], total: number, hasFeeds: boolean }`.

- [ ] **Step 1: Route'u yaz**

`app/api/feed/route.ts`:

```ts
// GET /api/feed → kullanıcının kayıtlı feed'lerine uyan pool ilanları
// (+ yıldız durumu + cache'li skor). Feed yoksa en yeni pool ilanları.
// MVP: sınırlı bir pencere çekilir (200), eşleştirme JS'te yapılır; ölçek
// büyüyünce sunucu-taraflı sorguya taşınır.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseQuery } from "@/lib/validation";
import { feedListQuerySchema, type PoolJobRow, type JobFeedRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { matchesFeed } from "@/lib/feed/filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { offset, limit } = parseQuery(new URL(req.url).searchParams, feedListQuerySchema);

  const [feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("job_feeds").select("id, name, keywords, min_budget, platform, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);
  if (feedsRes.error) throw feedsRes.error;
  if (poolRes.error) throw poolRes.error;
  if (starRes.error) throw starRes.error;
  if (scoreRes.error) throw scoreRes.error;

  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));

  const matched = feeds.length === 0
    ? pool
    : pool.filter((p) => feeds.some((f) => matchesFeed(p, { keywords: f.keywords, min_budget: f.min_budget, platform: f.platform })));

  const page: PoolJob[] = matched.slice(offset, offset + limit).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: starred.has(p.id), score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });

  return NextResponse.json({ jobs: page, total: matched.length, hasFeeds: feeds.length > 0 });
});
```

- [ ] **Step 2: Manuel doğrula (dev)**

`npm run dev` çalışırken, giriş yapmış oturumla tarayıcı konsolunda:
```js
await (await fetch("/api/feed?limit=5")).json()
```
Expected: `{ jobs: [...≤5], total: 8 (feed yoksa), hasFeeds: false }`. Her job'da `isStarred:false`, `score:null`.

- [ ] **Step 3: Commit**

```bash
git add app/api/feed/route.ts
git commit -m "feat(feed): GET /api/feed (feed'e uyan pool + yıldız + cache skor)"
```

---

## Task 5: GET /api/feed/search

**Files:**
- Create: `app/api/feed/search/route.ts`

**Interfaces:**
- Consumes: `searchPool` (Task 3), `feedSearchQuerySchema` (Task 2).
- Produces: `GET /api/feed/search?q&platform&minBudget&offset&limit` → `{ jobs: PoolJob[], total: number }`.

- [ ] **Step 1: Route'u yaz**

`app/api/feed/search/route.ts`:

```ts
// GET /api/feed/search → pool üzerinde anlık arama (kaydedilmez).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseQuery } from "@/lib/validation";
import { feedSearchQuerySchema, type PoolJobRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { searchPool } from "@/lib/feed/filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { q, platform, minBudget, offset, limit } = parseQuery(new URL(req.url).searchParams, feedSearchQuerySchema);

  const [poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);
  if (poolRes.error) throw poolRes.error;
  if (starRes.error) throw starRes.error;
  if (scoreRes.error) throw scoreRes.error;

  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));

  const filtered = searchPool(pool, { q, platform, minBudget });
  const page: PoolJob[] = filtered.slice(offset, offset + limit).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: starred.has(p.id), score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });

  return NextResponse.json({ jobs: page, total: filtered.length });
});
```

- [ ] **Step 2: Manuel doğrula (dev)**

```js
await (await fetch("/api/feed/search?q=react")).json()
```
Expected: `{ jobs: [...react içeren], total: ≥1 }`.

- [ ] **Step 3: Commit**

```bash
git add app/api/feed/search/route.ts
git commit -m "feat(feed): GET /api/feed/search (pool anlık arama)"
```

---

## Task 6: Feeds CRUD (/api/feeds, /api/feeds/[id])

**Files:**
- Create: `app/api/feeds/route.ts`
- Create: `app/api/feeds/[id]/route.ts`

**Interfaces:**
- Consumes: `feedCreateSchema`, `feedUpdateSchema` (Task 2).
- Produces: `GET/POST /api/feeds`, `PATCH/DELETE /api/feeds/[id]`. Feed satırı: `{ id, name, keywords, min_budget, platform, created_at }`.

- [ ] **Step 1: Liste + oluşturma route'unu yaz**

`app/api/feeds/route.ts`:

```ts
// GET  /api/feeds → kullanıcının kayıtlı feed'leri.
// POST /api/feeds → yeni feed (kullanıcı başına en çok 10).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { feedCreateSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FEEDS = 10;
const FEED_COLS = "id, name, keywords, min_budget, platform, created_at";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase.from("job_feeds").select(FEED_COLS).eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return NextResponse.json({ feeds: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedCreateSchema);

  const { count, error: countError } = await supabase.from("job_feeds").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_FEEDS) {
    throw new ValidationError((await getTranslations("errors"))("feedLimitReached"));
  }

  const { data, error } = await supabase.from("job_feeds").insert({
    user_id: user.id, name: input.name, keywords: input.keywords,
    min_budget: input.minBudget ?? null, platform: input.platform ?? null,
  }).select(FEED_COLS).single();
  if (error) throw error;
  return NextResponse.json({ feed: data }, { status: 201 });
});
```

- [ ] **Step 2: Güncelle/sil route'unu yaz**

`app/api/feeds/[id]/route.ts`:

```ts
// PATCH  /api/feeds/[id] → feed güncelle.
// DELETE /api/feeds/[id] → feed sil.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { feedUpdateSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEED_COLS = "id, name, keywords, min_budget, platform, created_at";

export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedUpdateSchema);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.keywords !== undefined) patch.keywords = input.keywords;
  if (input.minBudget !== undefined) patch.min_budget = input.minBudget;
  if (input.platform !== undefined) patch.platform = input.platform;

  const { data, error } = await supabase.from("job_feeds").update(patch).eq("id", id).eq("user_id", user.id).select(FEED_COLS).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError();
  return NextResponse.json({ feed: data });
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { error } = await supabase.from("job_feeds").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 3: `errors.feedLimitReached` anahtarı Task 10'da eklenir**

> Not: bu route `errors.feedLimitReached` kullanır; anahtar Task 10'da EN+TR'ye eklenir. Task 10 tamamlanmadan feed limiti hatası ham anahtar döndürebilir — sıralama korunursa sorun olmaz.

- [ ] **Step 4: Manuel doğrula (dev)**

```js
await (await fetch("/api/feeds", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name:"React", keywords:["react"] }) })).json()
await (await fetch("/api/feeds")).json()
```
Expected: POST 201 `{feed:{...}}`; GET `{feeds:[{name:"React"...}]}`.

- [ ] **Step 5: Commit**

```bash
git add app/api/feeds/route.ts app/api/feeds/[id]/route.ts
git commit -m "feat(feed): kayıtlı feed CRUD (/api/feeds + [id]), 10 feed limiti"
```

---

## Task 7: Starred (/api/starred)

**Files:**
- Create: `app/api/starred/route.ts`

**Interfaces:**
- Consumes: `starToggleSchema` (Task 2), `matchesFeed` yok — sadece join.
- Produces: `GET /api/starred` → `{ jobs: PoolJob[] }`; `POST /api/starred {jobPoolId}`; `DELETE /api/starred?jobPoolId=`.

- [ ] **Step 1: Route'u yaz**

`app/api/starred/route.ts`:

```ts
// GET    /api/starred → yıldızlı pool ilanları (+ cache skor).
// POST   /api/starred → yıldız ekle { jobPoolId }.
// DELETE /api/starred?jobPoolId= → yıldız kaldır.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseQuery } from "@/lib/validation";
import { starToggleSchema, type PoolJobRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_COLS = "id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data: stars, error: starErr } = await supabase.from("starred_jobs").select("job_pool_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (starErr) throw starErr;

  const ids = (stars ?? []).map((s) => s.job_pool_id as string);
  if (ids.length === 0) return NextResponse.json({ jobs: [] });

  const [poolRes, scoreRes] = await Promise.all([
    supabase.from("job_pool").select(POOL_COLS).in("id", ids),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id).in("job_pool_id", ids),
  ]);
  if (poolRes.error) throw poolRes.error;
  if (scoreRes.error) throw scoreRes.error;

  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const byId = new Map((poolRes.data as PoolJobRow[] ?? []).map((p) => [p.id, p]));

  // Yıldız sırasını koru.
  const jobs: PoolJob[] = ids.map((id) => byId.get(id)).filter((p): p is PoolJobRow => Boolean(p)).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: true, score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });
  return NextResponse.json({ jobs });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { jobPoolId } = await parseJson(req, starToggleSchema);
  const { error } = await supabase.from("starred_jobs").upsert({ user_id: user.id, job_pool_id: jobPoolId }, { onConflict: "user_id,job_pool_id" });
  if (error) throw error;
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { jobPoolId } = parseQuery(new URL(req.url).searchParams, starToggleSchema);
  const { error } = await supabase.from("starred_jobs").delete().eq("user_id", user.id).eq("job_pool_id", jobPoolId);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 2: Manuel doğrula (dev)**

Bir pool id al (`/api/feed`'ten), sonra:
```js
await fetch("/api/starred", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ jobPoolId:"<id>" }) })
await (await fetch("/api/starred")).json()   // { jobs:[{id:"<id>", isStarred:true}] }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/starred/route.ts
git commit -m "feat(feed): yıldız API (/api/starred GET/POST/DELETE)"
```

---

## Task 8: POST /api/feed/[poolId]/score (on-demand AI skor)

**Files:**
- Create: `app/api/feed/[poolId]/score/route.ts`

**Interfaces:**
- Consumes: `spendCredits`, `matchJobToProfile`, `getUserLocale`, admin client. Aynen `app/api/jobs/[id]/match/route.ts` deseni.
- Produces: `POST /api/feed/[poolId]/score` → `{ score, result, credits: { balance, spent } | null, cached: boolean }`.

- [ ] **Step 1: Route'u yaz**

`app/api/feed/[poolId]/score/route.ts`:

```ts
// POST /api/feed/[poolId]/score → profil × pool ilanı AI skoru.
// Cache: job_scores'ta varsa kredi harcamadan döner. Yoksa 1 kredi (job_match),
// sonucu job_scores'a upsert, maliyeti usage_events'e yazar. match route deseni.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchJobToProfile } from "@/lib/ai/match";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (_req, { params }) => {
  const { poolId } = await params as { poolId: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Cache kontrol: skor varsa kredi harcamadan döndür.
  const cachedRes = await supabase.from("job_scores").select("score, result").eq("user_id", user.id).eq("job_pool_id", poolId).maybeSingle();
  if (cachedRes.error) throw cachedRes.error;
  if (cachedRes.data) {
    return NextResponse.json({ score: cachedRes.data.score, result: cachedRes.data.result, credits: null, cached: true });
  }

  // Profil + pool ilanını çek.
  const [profileRes, poolRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_pool").select("description").eq("id", poolId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequiredMatch"));
  if (poolRes.error) throw poolRes.error;
  if (!poolRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  const locale = await getUserLocale();
  const admin = createSupabaseAdminClient();

  const { result, balance, spent } = await spendCredits(user.id, "job_match", async () => {
    const matched = await matchJobToProfile(profileRes.data as ProfileInput, poolRes.data!.description, locale);
    // Skoru cache'e yaz (service-role: job_scores insert politikası yok).
    const { error: upsertErr } = await admin.from("job_scores").upsert(
      { user_id: user.id, job_pool_id: poolId, score: matched.result.score, result: matched.result },
      { onConflict: "user_id,job_pool_id" },
    );
    if (upsertErr) throw upsertErr;
    return matched;
  });

  // Maliyet kaydı (kredi iadesi kapsamı dışında).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "job_match", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ score: result.result.score, result: result.result, credits: { balance, spent }, cached: false });
});
```

- [ ] **Step 2: Manuel doğrula (dev)**

Profil kayıtlıyken bir pool id ile:
```js
await (await fetch("/api/feed/<poolId>/score", { method:"POST" })).json()  // { score, result, credits:{...}, cached:false }
await (await fetch("/api/feed/<poolId>/score", { method:"POST" })).json()  // { ..., credits:null, cached:true }
```
Expected: ilk çağrı kredi düşer, ikinci çağrı `cached:true`, kredi düşmez.

- [ ] **Step 3: Commit**

```bash
git add "app/api/feed/[poolId]/score/route.ts"
git commit -m "feat(feed): on-demand AI skor route (kredi + job_scores cache)"
```

---

## Task 9: i18n — `feed` namespace + `errors` anahtarları

**Files:**
- Modify: `messages/en.json`, `messages/tr.json`

**Interfaces:**
- Produces: `feed.*` çeviri anahtarları; `errors.feedLimitReached`.

- [ ] **Step 1: EN kataloğuna ekle**

`messages/en.json` — `"errors"` bloğuna `"feedLimitReached"` ekle (mevcut bir anahtarın yanına, virgül dikkatiyle):

```json
"feedLimitReached": "You've reached the maximum of 10 saved feeds.",
```

Ve üst düzeye (örn. `"errors"`'tan önce) `"feed"` namespace'i ekle:

```json
"feed": {
  "tabs": { "feed": "Feed", "search": "Search", "starred": "Starred", "applied": "Applied" },
  "feedEmptyTitle": "No jobs match your feeds yet",
  "feedEmptyHint": "Create a feed with keywords and budget to start seeing matched jobs.",
  "noFeedsTitle": "Create your first feed",
  "noFeedsHint": "Save a search (keywords, budget, platform) and matching jobs show up here.",
  "createFeed": "Create feed",
  "searchPlaceholder": "Search jobs by keyword…",
  "searchEmpty": "No jobs found for this search.",
  "starredEmptyTitle": "No starred jobs",
  "starredEmptyHint": "Star jobs from the Feed or Search to save them here.",
  "star": "Star",
  "unstar": "Unstar",
  "analyze": "Analyze match",
  "analyzing": "Analyzing…",
  "openOnPlatform": "Open on platform",
  "markApplied": "Mark as applied",
  "applied": "Applied",
  "score": "Match",
  "postedRelative": "{time} ago",
  "budget": "Budget",
  "loadMore": "Load more",
  "modal": {
    "title": "Feed",
    "nameLabel": "Feed name",
    "namePlaceholder": "e.g. React & Next.js",
    "keywordsLabel": "Keywords",
    "keywordsPlaceholder": "react, next.js, typescript",
    "minBudgetLabel": "Min budget (USD)",
    "platformLabel": "Platform",
    "save": "Save feed",
    "cancel": "Cancel",
    "delete": "Delete feed"
  }
},
```

- [ ] **Step 2: TR kataloğuna aynı anahtarları ekle**

`messages/tr.json` — `"errors"` bloğuna:

```json
"feedLimitReached": "En fazla 10 kayıtlı feed'e ulaştın.",
```

Ve `"feed"` namespace'i:

```json
"feed": {
  "tabs": { "feed": "Feed", "search": "Ara", "starred": "Yıldızlı", "applied": "Başvurulan" },
  "feedEmptyTitle": "Feed'lerinle eşleşen iş yok",
  "feedEmptyHint": "Keyword ve bütçeyle bir feed oluştur; eşleşen işler burada görünsün.",
  "noFeedsTitle": "İlk feed'ini oluştur",
  "noFeedsHint": "Bir aramayı kaydet (keyword, bütçe, platform); eşleşen işler burada çıkar.",
  "createFeed": "Feed oluştur",
  "searchPlaceholder": "Keyword ile iş ara…",
  "searchEmpty": "Bu arama için iş bulunamadı.",
  "starredEmptyTitle": "Yıldızlı iş yok",
  "starredEmptyHint": "Feed veya Ara'dan işleri yıldızla; burada saklanır.",
  "star": "Yıldızla",
  "unstar": "Yıldızı kaldır",
  "analyze": "Uyumu analiz et",
  "analyzing": "Analiz ediliyor…",
  "openOnPlatform": "Platformda aç",
  "markApplied": "Başvurdum olarak işaretle",
  "applied": "Başvuruldu",
  "score": "Uyum",
  "postedRelative": "{time} önce",
  "budget": "Bütçe",
  "loadMore": "Daha fazla",
  "modal": {
    "title": "Feed",
    "nameLabel": "Feed adı",
    "namePlaceholder": "örn. React & Next.js",
    "keywordsLabel": "Keyword'ler",
    "keywordsPlaceholder": "react, next.js, typescript",
    "minBudgetLabel": "Min bütçe (USD)",
    "platformLabel": "Platform",
    "save": "Feed'i kaydet",
    "cancel": "İptal",
    "delete": "Feed'i sil"
  }
},
```

- [ ] **Step 3: Katalog testini çalıştır**

Run: `npm run test -- catalog`
Expected: PASS (EN/TR anahtar setleri eşit).

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/tr.json
git commit -m "feat(feed): feed i18n namespace + feedLimitReached (EN+TR)"
```

---

## Task 10: `formatRelativeTime` yardımcı + shared token

**Files:**
- Modify: `components/dashboard/shared.tsx`
- Create: `components/dashboard/shared.test.ts`

**Interfaces:**
- Produces: `formatRelativeTime(iso, now?)` → `{ value: number, unit: "minute"|"hour"|"day" }` (i18n metni tüketim noktasında).

- [ ] **Step 1: Testi yaz**

`components/dashboard/shared.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./shared";

const now = new Date("2026-07-01T12:00:00Z");

describe("formatRelativeTime", () => {
  it("dakika döndürür", () => {
    expect(formatRelativeTime("2026-07-01T11:30:00Z", now)).toEqual({ value: 30, unit: "minute" });
  });
  it("saat döndürür", () => {
    expect(formatRelativeTime("2026-07-01T09:00:00Z", now)).toEqual({ value: 3, unit: "hour" });
  });
  it("gün döndürür", () => {
    expect(formatRelativeTime("2026-06-29T12:00:00Z", now)).toEqual({ value: 2, unit: "day" });
  });
  it("null girdide null döner", () => {
    expect(formatRelativeTime(null, now)).toBeNull();
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız gör**

Run: `npm run test -- shared`
Expected: FAIL — `formatRelativeTime is not a function`.

- [ ] **Step 3: Yardımcıyı `shared.tsx` "Helpers" bölümüne ekle**

`components/dashboard/shared.tsx` içindeki `/* ── Helpers ── */` bölümüne:

```ts
/** ISO tarihini kaba göreli birime çevirir (i18n metni tüketimde uygulanır). */
export function formatRelativeTime(
  iso: string | null,
  now: Date = new Date(),
): { value: number; unit: "minute" | "hour" | "day" } | null {
  if (!iso) return null;
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return { value: minutes, unit: "minute" };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: "hour" };
  return { value: Math.floor(hours / 24), unit: "day" };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm run test -- shared`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/shared.tsx components/dashboard/shared.test.ts
git commit -m "feat(feed): formatRelativeTime yardımcısı (göreli zaman)"
```

---

## Task 11: `pool-job-row` bileşeni

**Files:**
- Create: `components/dashboard/pool-job-row.tsx`

**Interfaces:**
- Consumes: `PoolJob` (Task 2), `formatRelativeTime`, `scoreColor`, `PLATFORM_STYLES` (shared).
- Produces: `<PoolJobRow job onStar onOpen />` — liste satırı; Feed/Search/Starred ortak kullanır.

- [ ] **Step 1: Bileşeni yaz**

`components/dashboard/pool-job-row.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import { scoreColor, formatRelativeTime } from "./shared";

const UNIT_KEY = { minute: "min", hour: "hour", day: "day" } as const;

export function PoolJobRow({
  job, onStar, onOpen, selected = false,
}: {
  job: PoolJob;
  onStar: (job: PoolJob) => void;
  onOpen: (job: PoolJob) => void;
  selected?: boolean;
}) {
  const t = useTranslations("feed");
  const rel = formatRelativeTime(job.posted_at);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(job); } }}
      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 ${
        selected ? "border-[#00F0FF]/40 bg-[#00F0FF]/5" : "border-border hover:border-border/80 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug truncate">{job.title}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {job.source && <span className="capitalize">{job.source}</span>}
            {job.budget && <span>· {job.budget}</span>}
            {rel && <span>· {rel.value} {t(`${UNIT_KEY[rel.unit]}Short` as string, { count: rel.value })}</span>}
          </div>
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(job); }}
            className="text-muted-foreground/40 hover:text-amber-400 transition-colors cursor-pointer"
            title={job.isStarred ? t("unstar") : t("star")}
          >
            <Star className={`h-4 w-4 ${job.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          {job.score !== null && (
            <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.score)}`}>{job.score}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

> Not: `minShort`/`hourShort`/`dayShort` i18n anahtarları gerekli — Task 9 kataloğuna EN: `"minShort": "{count}m", "hourShort": "{count}h", "dayShort": "{count}d"`; TR: `"minShort": "{count}dk", "hourShort": "{count}sa", "dayShort": "{count}g"` ekle (feed namespace'ine). İki kataloğu da güncelle, `npm run test -- catalog` yeşil kalsın.

- [ ] **Step 2: Task 9 kataloglarına short anahtarları ekle + katalog testi**

`feed` namespace'ine (EN ve TR) yukarıdaki 3 short anahtarı ekle. Run: `npm run test -- catalog` → PASS.

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: hata yok.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/pool-job-row.tsx messages/en.json messages/tr.json
git commit -m "feat(feed): PoolJobRow satır bileşeni + göreli zaman kısa anahtarları"
```

---

## Task 12: `pool-job-panel` detay paneli

**Files:**
- Create: `components/dashboard/pool-job-panel.tsx`

**Interfaces:**
- Consumes: `PoolJob`, `scoreColor`, `scoreBarColor`. API: `POST /api/feed/[poolId]/score`, `POST /api/jobs` (apply köprüsü).
- Produces: `<PoolJobPanel job onClose onScored onApplied onCreditsUpdate />`.

- [ ] **Step 1: Bileşeni yaz**

`components/dashboard/pool-job-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { scoreColor, scoreBarColor } from "./shared";

export function PoolJobPanel({
  job, onClose, onScored, onApplied, onCreditsUpdate,
}: {
  job: PoolJob;
  onClose: () => void;
  onScored: (poolId: string, score: number, result: JobMatchResult) => void;
  onApplied: (poolId: string) => void;
  onCreditsUpdate: (balance: number) => void;
}) {
  const t = useTranslations("feed");
  const [scoring, setScoring] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setScoring(true); setError("");
    const res = await fetch(`/api/feed/${job.id}/score`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? "Error"); setScoring(false); return; }
    onScored(job.id, body.score, body.result);
    if (body.credits) onCreditsUpdate(body.credits.balance);
    setScoring(false);
  }

  async function apply() {
    // Upwork'te aç + mevcut job_listings pipeline'ına köprü.
    if (job.url) window.open(job.url, "_blank", "noopener");
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: job.title, description: job.description, platform: job.source,
        url: job.url ?? undefined, budget: job.budget ?? undefined, source_pool_id: job.id,
      }),
    });
    if (res.ok) { setApplied(true); onApplied(job.id); }
  }

  const result = job.scoreResult;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {job.source}{job.budget ? ` · ${job.budget}` : ""}{job.client_country ? ` · ${job.client_country}` : ""}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {job.score !== null && result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold rounded-md px-2 py-0.5 ${scoreColor(job.score)}`}>{t("score")} {job.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor(job.score)}`} style={{ width: `${job.score}%` }} />
            </div>
            {result.summary && <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>}
            {result.strengths.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={analyze} disabled={scoring} className="gap-2 w-full">
            <Sparkles className="h-4 w-4" />{scoring ? t("analyzing") : t("analyze")}
          </Button>
        )}

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{t("budget")}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{job.description}</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="border-t border-border p-4 flex items-center gap-2">
        {job.url && (
          <Button asChild variant="outline" className="gap-2 flex-1">
            <a href={job.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{t("openOnPlatform")}</a>
          </Button>
        )}
        <Button onClick={apply} disabled={applied} className="gap-2 flex-1">
          {applied ? <><Check className="h-4 w-4" />{t("applied")}</> : t("markApplied")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run typecheck`
Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/pool-job-panel.tsx
git commit -m "feat(feed): PoolJobPanel (skor + Upwork deep-link + apply köprüsü)"
```

---

## Task 13: `feed-view`, `search-view`, `starred-view`

**Files:**
- Create: `components/dashboard/feed-view.tsx`
- Create: `components/dashboard/search-view.tsx`
- Create: `components/dashboard/starred-view.tsx`

**Interfaces:**
- Consumes: `PoolJobRow`, `PoolJobPanel`, API'ler (feed/search/starred). `useDashboard().applyCredits`.
- Produces: üç görünüm bileşeni; `jobs-tab` segmented kabuğu (Task 14) tüketir.

- [ ] **Step 1: Ortak liste+panel düzeni için `feed-view.tsx`**

`components/dashboard/feed-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function FeedView({
  initialJobs, hasFeeds, onCreateFeed,
}: {
  initialJobs: PoolJob[];
  hasFeeds: boolean;
  onCreateFeed: () => void;
}) {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function toggleStar(job: PoolJob) {
    const next = !job.isStarred;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: next } : j));
    await fetch(`/api/starred${next ? "" : `?jobPoolId=${job.id}`}`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ jobPoolId: job.id }) : undefined,
    });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Briefcase className="h-7 w-7 text-muted-foreground/40" /></div>
        <p className="text-sm font-semibold text-muted-foreground">{hasFeeds ? t("feedEmptyTitle") : t("noFeedsTitle")}</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{hasFeeds ? t("feedEmptyHint") : t("noFeedsHint")}</p>
        <Button variant="outline" onClick={onCreateFeed} className="gap-2 mt-4"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreateFeed} className="gap-2"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
      </div>
      <div className="grid lg:grid-cols-5 gap-3">
        <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
          {jobs.map((job) => (
            <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={toggleStar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
            <PoolJobPanel
              job={selected}
              onClose={() => setSelectedId(null)}
              onScored={onScored}
              onApplied={() => {}}
              onCreditsUpdate={(balance) => applyCredits(balance)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `search-view.tsx`**

`components/dashboard/search-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function SearchView() {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`);
    const body = await res.json().catch(() => ({ jobs: [] }));
    setJobs(body.jobs ?? []); setSearched(true); setSelectedId(null);
  }

  async function toggleStar(job: PoolJob) {
    const next = !job.isStarred;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: next } : j));
    await fetch(`/api/starred${next ? "" : `?jobPoolId=${job.id}`}`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ jobPoolId: job.id }) : undefined,
    });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  return (
    <div className="space-y-3">
      <form onSubmit={runSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40" />
      </form>
      {searched && jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">{t("searchEmpty")}</p>}
      <div className="grid lg:grid-cols-5 gap-3">
        <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
          {jobs.map((job) => (
            <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={toggleStar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
            <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(b) => applyCredits(b)} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `starred-view.tsx`**

`components/dashboard/starred-view.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function StarredView() {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/starred").then((r) => r.json()).then((b) => { setJobs(b.jobs ?? []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  async function unstar(job: PoolJob) {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    if (selectedId === job.id) setSelectedId(null);
    await fetch(`/api/starred?jobPoolId=${job.id}`, { method: "DELETE" });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  if (loaded && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Star className="h-7 w-7 text-muted-foreground/40" /></div>
        <p className="text-sm font-semibold text-muted-foreground">{t("starredEmptyTitle")}</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("starredEmptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-3">
      <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
        {jobs.map((job) => (
          <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={unstar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
        ))}
      </div>
      {selected && (
        <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
          <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(b) => applyCredits(b)} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run typecheck`
Expected: hata yok (henüz kullanılmıyorlar; Task 15 bağlar).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/feed-view.tsx components/dashboard/search-view.tsx components/dashboard/starred-view.tsx
git commit -m "feat(feed): Feed/Search/Starred görünümleri"
```

---

## Task 14: `feed-modal` (feed oluştur/düzenle)

**Files:**
- Create: `components/dashboard/feed-modal.tsx`

**Interfaces:**
- Consumes: `POST /api/feeds`, `PATCH/DELETE /api/feeds/[id]`.
- Produces: `<FeedModal onClose onSaved />`.

- [ ] **Step 1: Bileşeni yaz**

`components/dashboard/feed-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("feed");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setError("");
    const body = {
      name: name.trim(),
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      minBudget: minBudget ? Number(minBudget) : undefined,
    };
    const res = await fetch("/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.error?.message ?? "Error"); setSaving(false); return; }
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t("modal.title")}</h3>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.nameLabel")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("modal.namePlaceholder")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.keywordsLabel")}</span>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={t("modal.keywordsPlaceholder")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("modal.minBudgetLabel")}</span>
            <input value={minBudget} onChange={(e) => setMinBudget(e.target.value)} inputMode="numeric" placeholder="500" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>{t("modal.cancel")}</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{t("modal.save")}</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npm run typecheck` → hata yok.

```bash
git add components/dashboard/feed-modal.tsx
git commit -m "feat(feed): FeedModal (feed oluştur)"
```

---

## Task 15: Applied görünümü ayır + segmented kabuk + sayfa verisi

**Files:**
- Create: `components/dashboard/applied-view.tsx` (mevcut `jobs-tab` içeriği)
- Modify: `components/dashboard/jobs-tab.tsx` (segmented kabuk)
- Modify: `app/dashboard/jobs/page.tsx` (feed + pool ilk dilim)

**Interfaces:**
- Consumes: `FeedView`, `SearchView`, `StarredView`, `AppliedView`, `FeedModal`.
- Produces: `/dashboard/jobs?view=feed|search|starred|applied` segmented dashboard.

- [ ] **Step 1: Mevcut `jobs-tab.tsx` gövdesini `applied-view.tsx`'e taşı**

`components/dashboard/applied-view.tsx` oluştur: mevcut `jobs-tab.tsx` (satır 1-178) içeriğini **birebir** kopyala, yalnız fonksiyon adını `AppliedView` yap ve export'u `export function AppliedView(...)` olarak değiştir. İçindeki mantık (jobs state, deleteJob, JobDetailPanel, JobAddModal, stat bar) aynen kalır.

- [ ] **Step 2: `jobs-tab.tsx`'i segmented kabuğa dönüştür**

`components/dashboard/jobs-tab.tsx` (tam içerik):

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { JobRow } from "./shared";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import { FeedView } from "./feed-view";
import { SearchView } from "./search-view";
import { StarredView } from "./starred-view";
import { AppliedView } from "./applied-view";
import { FeedModal } from "./feed-modal";

type View = "feed" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "search", "starred", "applied"];

export function JobsTab({
  initialJobs, profileSaved, initialFeedJobs, hasFeeds, initialView,
}: {
  initialJobs: JobRow[];
  profileSaved: boolean;
  initialFeedJobs: PoolJob[];
  hasFeeds: boolean;
  initialView: View;
}) {
  const t = useTranslations("feed");
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<View>(initialView);
  const [feedModalOpen, setFeedModalOpen] = useState(false);

  function selectView(v: View) {
    setView(v);
    const next = new URLSearchParams(params.toString());
    next.set("view", v);
    router.replace(`/dashboard/jobs?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => selectView(v)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`tabs.${v}`)}
          </button>
        ))}
      </div>

      {view === "feed" && <FeedView initialJobs={initialFeedJobs} hasFeeds={hasFeeds} onCreateFeed={() => setFeedModalOpen(true)} />}
      {view === "search" && <SearchView />}
      {view === "starred" && <StarredView />}
      {view === "applied" && <AppliedView initialJobs={initialJobs} profileSaved={profileSaved} />}

      {feedModalOpen && <FeedModal onClose={() => setFeedModalOpen(false)} onSaved={() => selectView("feed")} />}
    </div>
  );
}
```

- [ ] **Step 3: `app/dashboard/jobs/page.tsx`'i güncelle**

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobsTab } from "@/components/dashboard/jobs-tab";
import type { JobRow } from "@/components/dashboard/shared";
import type { PoolJob, PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import { matchesFeed } from "@/lib/feed/filter";

type View = "feed" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "search", "starred", "applied"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { view: viewParam } = await searchParams;

  const [profileRes, jobsRes, feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_feeds").select("id, name, keywords, min_budget, platform, created_at").eq("user_id", user.id),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const profileSaved = profileRes.data !== null;
  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));

  const matched = feeds.length === 0
    ? pool
    : pool.filter((p) => feeds.some((f) => matchesFeed(p, { keywords: f.keywords, min_budget: f.min_budget, platform: f.platform })));

  const initialFeedJobs: PoolJob[] = matched.slice(0, 25).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: starred.has(p.id), score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });

  const requested = (viewParam && VIEWS.includes(viewParam as View)) ? (viewParam as View) : null;
  const initialView: View = requested ?? (profileSaved ? "feed" : "applied");

  return (
    <JobsTab
      initialJobs={jobs}
      profileSaved={profileSaved}
      initialFeedJobs={initialFeedJobs}
      hasFeeds={feeds.length > 0}
      initialView={initialView}
    />
  );
}
```

- [ ] **Step 4: Tam kontrol**

Run: `npm run check`
Expected: lint + typecheck + vitest hepsi PASS.

- [ ] **Step 5: Manuel doğrula (dev)**

`npm run dev` → `/dashboard/jobs`:
- Segmented control: Feed/Search/Starred/Applied geçişleri URL'i (`?view=`) günceller.
- Feed: seed ilanları listeler; yıldız çalışır; bir ilana tıkla → panel; "Analyze match" 1 kredi düşer, skor görünür; ikinci analiz cache (kredi düşmez).
- Search: "react" ara → filtreli sonuç.
- Starred: yıldızlananlar listelenir.
- Applied: mevcut takipçi (iş ekle, durum, teklif) bozulmadan çalışır.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/applied-view.tsx components/dashboard/jobs-tab.tsx app/dashboard/jobs/page.tsx
git commit -m "feat(feed): segmented Jobs kabuğu (Feed/Search/Starred/Applied) + sayfa verisi"
```

---

## Task 16: Dokümantasyon (CLAUDE.md + ROADMAP)

**Files:**
- Modify: `CLAUDE.md` ("Neyin nerede")
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: `CLAUDE.md` "Neyin nerede"ye ekle**

Uygun yerlere (jobs API ve dashboard bileşenleri bölümleri) şu satırları ekle:
- `app/api/feed` — GET: feed'e uyan pool ilanları (+yıldız+cache skor).
- `app/api/feed/search` — GET: pool anlık arama.
- `app/api/feed/[poolId]/score` — POST: on-demand AI skor (kredi + `job_scores` cache).
- `app/api/feeds` (+`[id]`) — kayıtlı feed CRUD; `app/api/starred` — yıldız GET/POST/DELETE.
- `lib/feed/filter.ts` — saf feed filtre/arama yardımcıları.
- `lib/validation/schemas/feed.ts` — feed/arama/yıldız şemaları + `PoolJob` tipleri.
- `components/dashboard/`: `jobs-tab` segmented kabuk (Feed/Search/Starred/Applied); `feed-view`/`search-view`/`starred-view`/`applied-view`; `pool-job-row`/`pool-job-panel`/`feed-modal`.
- `supabase/migrations/0012_job_feed.sql` — `job_pool` (paylaşımlı) + `job_feeds`/`starred_jobs`/`job_scores` + `job_listings.source_pool_id`. `supabase/seed/job_pool_sample.sql` — örnek pool.

- [ ] **Step 2: `docs/ROADMAP.md`'e faz kaydı ekle**

Faz 6'dan önce:
```markdown
- **Faz 10 — İş Feed Dashboard (Alt-proje A)** ✅
  uphunt tarzı keşif: `/dashboard/jobs` segmented (Feed/Search/Starred/Applied); paylaşımlı
  `job_pool` + kullanıcı `job_feeds`/`starred_jobs`/`job_scores` (migration 0012); on-demand
  AI skorlama (kredi + cache); Upwork deep-link + mevcut pipeline'a apply köprüsü. Seed veriyle
  çalışır; canlı çekme Alt-proje B'de. `main` üzerinde.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/ROADMAP.md
git commit -m "docs(feed): Neyin nerede + ROADMAP Faz 10 (Alt-proje A)"
```

---

## Self-Review (yazım sonrası)

**Spec kapsama:** §3 IA → Task 15; §4 veri modeli → Task 1; §5 görünümler → Task 11-15;
§6 skorlama → Task 8; §7 API → Task 4-8; §8 bileşenler → Task 11-15; §9 i18n → Task 9,11;
§10 seed → Task 1; §11 güvenlik → tüm route'lar `withErrorHandler`+Zod+RLS; §12 test →
Task 2,3,10. Tümü karşılanıyor.

**Placeholder taraması:** yok — her kod adımı tam.

**Tip tutarlılığı:** `PoolJob` (feed.ts) tüm route/bileşende aynı; `matchesFeed(pool, {keywords,
min_budget, platform})` imzası Task 3/4/15'te aynı; `formatRelativeTime` Task 10/11'de tutarlı;
score route dönüşü `{score, result, credits, cached}` Task 8/12'de aynı.

**Bilinen sıralama bağımlılığı:** Task 6 `errors.feedLimitReached` kullanır; anahtar Task 9'da
eklenir. Task 11 `feed.*Short` anahtarlarını Task 9 kataloğuna ekler (Step 2). Uygulama sırası
korunmalı; `npm run check` her task sonunda doğrular.
