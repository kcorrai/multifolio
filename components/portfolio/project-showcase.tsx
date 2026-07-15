"use client";

// Public portfolyo "proje-proje" gösterimi (client): her proje bir kart olarak render
// edilir; karta tıklanınca ProjectDetailModal (Upwork tarzı) ekranın önüne gelir.
// Server sayfası (/p/[slug]) proje gruplarını + tema değişkenlerini (portal içinde
// çözülsün diye modala aktarılır) + yedek alt metni geçer.
import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { ProjectDetailModal, type ShowcaseProject } from "./project-detail-modal";

export type { ShowcaseProject };

export function ProjectShowcase({
  projects, fallbackAlt, themeVars,
}: {
  projects: ShowcaseProject[];
  fallbackAlt: string;
  /** Sayfanın --pf-* tema değişkenleri — modal body'ye portallandığından ona aktarılır. */
  themeVars?: CSSProperties;
}) {
  const t = useTranslations("portfolioPublic");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => {
          const cover = p.images[0];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
              className="anim-fade-up group flex flex-col overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] text-left transition-colors hover:border-[var(--pf-accent)]"
            >
              {cover && (
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.url}
                    alt={cover.caption || p.title || fallbackAlt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {p.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                      {p.images.length}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-snug text-[var(--pf-text)]">{p.title || t("projects")}</h3>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--pf-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                {p.role && <p className="text-xs font-semibold text-[var(--pf-accent)]">{p.role}</p>}
                {p.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-[var(--pf-muted)]">{p.description}</p>
                )}
                {(p.skills?.length ?? 0) > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {p.skills!.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full border border-[var(--pf-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--pf-muted)]">{s}</span>
                    ))}
                    {p.skills!.length > 3 && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--pf-muted)]">+{p.skills!.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {open !== null && projects[open] && (
        <ProjectDetailModal project={projects[open]} fallbackAlt={fallbackAlt} onClose={() => setOpen(null)} vars={themeVars} />
      )}
    </>
  );
}
