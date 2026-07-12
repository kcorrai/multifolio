/* Landing "nasıl görünüyor" vitrinleri — dashboard'a benzeyen yüksek-sadakatli mockup'lar
   (statik, sunucu bileşeni). Gerçek ekran görüntüsü yerine gerçek bileşen stilleriyle kurulmuş
   sahne. Renk vurgusu #00F0FF; PlatformLogo gerçek logolar. */
import { getTranslations } from "next-intl/server";
import { Layers, Rss, Search, Star, Briefcase, Plus, CheckCheck, SlidersHorizontal, Sparkles, Zap } from "lucide-react";
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
  const t = await getTranslations("landing.showcase");
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

  const navItem = "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-white/50";

  return (
    <div className="flex text-left">
      {/* Sol: feed sidebar */}
      <aside className="hidden sm:flex w-44 shrink-0 flex-col gap-1 border-r border-slate-200 p-3 dark:border-white/8">
        <div className="mb-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#00F0FF] py-1.5 text-[11px] font-bold text-[#04121a]">
          <Plus className="h-3.5 w-3.5" />{tf("createFeed")}
        </div>
        <p className="px-2 pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{tf("savedFeeds")}</p>
        <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-white/50">
          <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5" />{tf("allJobs")}</span>
          <span className="text-[10px] tabular-nums text-slate-400 dark:text-white/30">40</span>
        </div>
        {feeds.map((f, i) => (
          <div key={f.name} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${i === 0 ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-slate-800 dark:text-white" : "border-transparent text-slate-500 dark:text-white/50"}`}>
            <span className="inline-flex items-center gap-2 min-w-0"><Rss className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]/70" /><span className="truncate">{f.name}</span></span>
            {f.unread > 0
              ? <span className="rounded-full bg-[#00F0FF]/20 px-1.5 text-[10px] font-bold tabular-nums text-[#00F0FF]">{f.unread}</span>
              : <span className="text-[10px] tabular-nums text-slate-400 dark:text-white/30">{f.count}</span>}
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
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-white/40"><CheckCheck className="h-3 w-3" />{tf("markAllRead")}</span>
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
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 dark:text-white/35">
                  <span>{j.budget}</span><span>·</span><span>{td("remote")}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {j.skills.map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/8 dark:text-white/50">{s}</span>
                  ))}
                </div>
              </div>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums ${scoreTone(j.score)}`}>{j.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ: ayar paneli özeti (lg+) */}
      <aside className="hidden lg:block w-56 shrink-0 space-y-3 p-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{feeds[0].name}</p>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/8">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-white/80"><SlidersHorizontal className="h-3.5 w-3.5 text-[#00F0FF]" />{tf("settingsPrefilter")}</div>
          <div className="flex flex-wrap gap-1">
            {["react", "next.js", "remote", "senior"].map((k) => (
              <span key={k} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/8 dark:text-white/50">{k}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/8">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-white/80"><Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />{tf("settingsScoring")}</div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-white/40"><span>{tf("showLowScores")}</span><span className="font-bold text-[#00F0FF]">7</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/8"><div className="h-full w-[70%] rounded-full bg-[#00F0FF]" /></div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 p-3 dark:border-white/8">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-white/50"><Zap className="h-3.5 w-3.5" />{tf("autoApplyTitle")}</span>
            <span className="rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#00F0FF]">{tf("autoApplyComingSoon")}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
