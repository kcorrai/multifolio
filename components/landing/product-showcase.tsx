/* Landing "nasıl görünüyor" vitrinleri — dashboard'a benzeyen yüksek-sadakatli mockup'lar
   (statik, sunucu bileşeni). Gerçek ekran görüntüsü yerine gerçek bileşen stilleriyle kurulmuş
   sahne. Renk vurgusu #00F0FF; PlatformLogo gerçek logolar. */
import { getTranslations } from "next-intl/server";
import { Layers, Rss, Search, Star, Briefcase, Plus, CheckCheck, SlidersHorizontal, Sparkles, Zap, Mail, Moon, Eye, MousePointerClick } from "lucide-react";
import { PlatformLogo } from "@/components/platform-logo";
import type { PlatformId } from "@/lib/ai/platforms";

/* Feed satırı skoru için renk (dashboard scoreColor deseninin sadeleştirilmişi). */
function scoreTone(score: number): string {
  if (score >= 85) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 70) return "text-[#00F0FF]";
  return "text-amber-500 dark:text-amber-400";
}

interface JobMock {
  title: string;
  platform: PlatformId | null;
  score: number;
  budget: string;
  skills: string[];
  unread: boolean;
}

/* ── Feed vitrini: 3-kolon iş keşfi (jobs-tab yansıması) ──────────── */
export async function FeedShowcase() {
  const tf = await getTranslations("feed");
  const td = await getTranslations("landing.demos");

  const feeds = [
    { name: "React roles", unread: 4, count: 26 },
    { name: "UI/UX design", unread: 0, count: 14 },
  ];
  const jobs: JobMock[] = [
    { title: td("jobA"), platform: "upwork", score: 92, budget: "$45/hr", skills: ["React", "Next.js"], unread: true },
    { title: td("jobB"), platform: "linkedin", score: 78, budget: "$3k", skills: ["TypeScript", "Node"], unread: true },
    { title: td("jobC"), platform: "fiverr", score: 85, budget: "$800", skills: ["UI/UX", "Figma"], unread: false },
    { title: "Landing page revamp", platform: "upwork", score: 88, budget: "$1.2k", skills: ["Tailwind", "SEO"], unread: false },
  ];

  const navItem = "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-white/50";

  return (
    // Dekoratif vitrin: bölüm başlığı/açıklaması anlamı taşır; ekran okuyucu sahte
    // mockup içeriğini (isim/ilan başlıkları) gerçek içerik gibi okumasın.
    <div className="flex text-left" aria-hidden="true">
      {/* Sol: feed sidebar */}
      <aside className="hidden sm:flex w-44 shrink-0 flex-col gap-1 border-r border-slate-200 p-3 dark:border-white/8">
        <div className="mb-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#00F0FF] py-1.5 text-xs font-bold text-[#04121a]">
          <Plus className="h-3.5 w-3.5" />{tf("createFeed")}
        </div>
        <p className="px-2 pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{tf("savedFeeds")}</p>
        <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-white/50">
          <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5" />{tf("allJobs")}</span>
          <span className="text-[11px] tabular-nums text-slate-400 dark:text-white/30">40</span>
        </div>
        {feeds.map((f, i) => (
          <div key={f.name} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium ${i === 0 ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-slate-800 dark:text-white" : "border-transparent text-slate-500 dark:text-white/50"}`}>
            <span className="inline-flex items-center gap-2 min-w-0"><Rss className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]/70" /><span className="truncate">{f.name}</span></span>
            {f.unread > 0
              ? <span className="rounded-full bg-[#00F0FF]/20 px-1.5 text-[11px] font-bold tabular-nums text-[#00F0FF]">{f.unread}</span>
              : <span className="text-[11px] tabular-nums text-slate-400 dark:text-white/30">{f.count}</span>}
          </div>
        ))}
        <div className="my-1.5 border-t border-slate-200 dark:border-white/8" />
        <div className={navItem}><Search className="h-3.5 w-3.5" />{tf("navSearch")}</div>
        <div className={navItem}><Star className="h-3.5 w-3.5" />{tf("navStarred")}</div>
        <div className={navItem}><Briefcase className="h-3.5 w-3.5" />{tf("navApplied")}</div>
      </aside>

      {/* Orta: ilan rayı */}
      <div className="flex-1 min-w-0 border-r border-slate-200 dark:border-white/8">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-white/8">
          <span className="text-xs font-bold text-slate-800 dark:text-white">{tf("railTitle")}</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-white/40"><CheckCheck className="h-3 w-3" />{tf("markAllRead")}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {jobs.map((j) => (
            <div key={j.title} className="flex items-start gap-2.5 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {j.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00F0FF]" />}
                  {j.platform && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-slate-500 dark:bg-white/8 dark:text-white/50">
                      <PlatformLogo platform={j.platform} size={10} />{j.platform}
                    </span>
                  )}
                  <span className={`truncate text-[12px] ${j.unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-white/60"}`}>{j.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 dark:text-white/35">
                  <span>{j.budget}</span><span>·</span><span>{td("remote")}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {j.skills.map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/8 dark:text-white/50">{s}</span>
                  ))}
                </div>
              </div>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-extrabold tabular-nums ${scoreTone(j.score)}`}>{j.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ: ayar paneli özeti (lg+) */}
      <aside className="hidden lg:block w-56 shrink-0 space-y-3 p-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{feeds[0].name}</p>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/8">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-white/80"><SlidersHorizontal className="h-3.5 w-3.5 text-[#00F0FF]" />{tf("settingsPrefilter")}</div>
          <div className="flex flex-wrap gap-1">
            {["react", "next.js", "remote", "senior"].map((k) => (
              <span key={k} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/8 dark:text-white/50">{k}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/8">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-white/80"><Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />{tf("settingsScoring")}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/40"><span>{tf("showLowScores")}</span><span className="font-bold text-[#00F0FF]">7</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/8"><div className="h-full w-[70%] rounded-full bg-[#00F0FF]" /></div>
        </div>
        <div className="rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/[0.06] p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-white/80"><Zap className="h-3.5 w-3.5 text-[#00F0FF]" />{tf("autoPilot.title")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#00F0FF] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#04121a]"><span className="h-1 w-1 rounded-full bg-[#04121a]" />{tf("autoPilot.on")}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50">
            <span>{tf("autoPilot.dailyDrafts")}</span>
            <span className="font-semibold text-[#00F0FF]">{tf("autoPilot.noSubmit")}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ── Otomatik Pilot vitrini: 3 adımlı akış şeridi (dekoratif) ──────── */
export async function AutoPilotShowcase() {
  const t = await getTranslations("landing.showcase.autoPilot");
  const steps = [
    { icon: Moon, title: t("step1Title"), desc: t("step1Desc") },
    { icon: Eye, title: t("step2Title"), desc: t("step2Desc") },
    { icon: MousePointerClick, title: t("step3Title"), desc: t("step3Desc") },
  ];
  return (
    <div aria-hidden="true" className="grid gap-3 text-left sm:grid-cols-3">
      {steps.map((s, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/8 dark:bg-[#0f1119]">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00F0FF]/12 text-[#00F0FF]">
              <s.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-300 dark:text-white/25">0{i + 1}</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-white/50">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Portfolyo vitrini: public /p/[slug] sayfası yansıması ─────────── */
export async function PortfolioShowcase() {
  const t = await getTranslations("landing.showcase.portfolio");
  // Galeri döşemeleri — gradyan yer tutucu (gerçek görsel yok).
  const tiles = [
    "h-24 from-indigo-400/30 to-violet-400/20",
    "h-32 from-[#00F0FF]/25 to-cyan-300/15",
    "h-20 from-violet-400/25 to-fuchsia-300/15",
    "h-28 from-emerald-400/25 to-teal-300/15",
    "h-24 from-amber-400/25 to-orange-300/15",
    "h-20 from-rose-400/25 to-pink-300/15",
  ];
  return (
    <div className="text-left" aria-hidden="true">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00F0FF]/8 via-transparent to-violet-500/8" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#00F0FF]/30 to-violet-400/20 text-lg font-extrabold text-slate-700 dark:text-white">AY</div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">Ahmet Yılmaz</p>
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">{t("role")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["React", "Next.js", "UI/UX", "Figma"].map((s) => (
              <span key={s} className="rounded-full border border-slate-200 bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">{s}</span>
            ))}
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-4 py-1.5 text-[12px] font-bold text-[#04121a]">
            <Mail className="h-3.5 w-3.5" />{t("hire")}
          </span>
        </div>
      </div>
      {/* Galeri (masonry) */}
      <div className="border-t border-slate-100 px-6 py-6 dark:border-white/5 sm:px-10">
        <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
          {tiles.map((c, i) => (
            <div key={i} className={`break-inside-avoid rounded-xl bg-gradient-to-br ${c}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── CV vitrini: ATS şablon önizlemeleri ──────────────────────────── */
export async function CvShowcase() {
  const t = await getTranslations("landing.showcase.cv");
  const td = await getTranslations("landing.demos");
  const line = "h-1.5 rounded-full bg-slate-200 dark:bg-white/12";

  // Ortak mini-bölüm (deneyim + skiller).
  const body = (accent: string) => (
    <>
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{td("experience")}</p>
      <div className={`${line} w-full`} />
      <div className={`${line} w-5/6`} />
      <div className={`${line} w-4/6`} />
      <div className="flex flex-wrap gap-1 pt-1">
        {["React", "Node", "SQL"].map((s) => (
          <span key={s} className="rounded px-1.5 py-0.5 text-[7px] font-bold" style={{ backgroundColor: `${accent}1a`, color: accent }}>{s}</span>
        ))}
      </div>
    </>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
      {/* Clean — üst vurgu şeridi */}
      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-[#0f1119] dark:ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Ahmet Yılmaz</p>
            <p className="text-[8px] font-medium text-slate-400 dark:text-white/40">Product Designer</p>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wide text-[#0891b2]">{t("tplClean")}</span>
        </div>
        <div className="mb-2 h-0.5 w-full rounded bg-[#0891b2]/60" />
        <div className="space-y-1.5">{body("#0891b2")}</div>
      </div>

      {/* Modern — renkli isim */}
      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-[#0f1119] dark:ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#7c3aed]">Ahmet Yılmaz</p>
            <p className="text-[8px] font-medium text-slate-400 dark:text-white/40">Product Designer</p>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wide text-[#7c3aed]">{t("tplModern")}</span>
        </div>
        <div className="space-y-1.5">{body("#7c3aed")}</div>
      </div>

      {/* Sidebar — sol renkli kolon */}
      <div className="flex overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0f1119] dark:ring-white/10">
        <div className="w-1/3 shrink-0 space-y-1.5 bg-[#0f766e]/10 p-2">
          <div className="mx-auto h-7 w-7 rounded-full bg-[#0f766e]/40" />
          <div className="h-1 w-full rounded bg-[#0f766e]/30" />
          <div className="h-1 w-4/5 rounded bg-[#0f766e]/30" />
          <p className="pt-1 text-[7px] font-bold uppercase text-[#0f766e]">{t("tplSidebar")}</p>
        </div>
        <div className="flex-1 space-y-1.5 p-2.5">
          <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Ahmet Yılmaz</p>
          {body("#0f766e")}
        </div>
      </div>
    </div>
  );
}
