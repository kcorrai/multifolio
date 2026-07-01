// /p/[slug] — genel portfolyo sayfası. Auth gerekmez; yalnızca published=true
// portfolyolar görünür. İçerik yapılandırılmış JSON; React metin render'ı
// otomatik escape eder (dangerouslySetInnerHTML kullanılmaz).
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// cache() ile aynı istek içinde generateMetadata + page tek sorgu yapar.
const fetchPortfolio = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("content, updated_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = portfolioContentSchema.safeParse(data.content);
  if (!parsed.success) return null;
  return { content: parsed.data, updatedAt: data.updated_at as string };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await fetchPortfolio(slug);
  if (!portfolio) {
    const t = await getTranslations("portfolioPublic");
    return { title: t("notFoundTitle") };
  }
  const { headline, bio } = portfolio.content;
  const description = bio.slice(0, 160);
  return {
    title: headline,
    description,
    openGraph: {
      title: headline,
      description,
      type: "profile",
    },
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  const portfolio = await fetchPortfolio(slug);
  if (!portfolio) notFound();
  const { content, updatedAt } = portfolio;
  const t = await getTranslations("portfolioPublic");

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{content.headline}</h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            {t("about")}
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-neutral-800">{content.bio}</p>
        </section>

        {content.skills.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              {t("skills")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {content.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {content.projects.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              {t("projects")}
            </h2>
            <div className="space-y-4">
              {content.projects.map((project, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-1">
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </a>
                  ) : (
                    <p className="font-medium">{project.title}</p>
                  )}
                  <p className="text-sm text-neutral-600">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-neutral-400">
          {t("lastUpdated")}: {new Date(updatedAt).toLocaleDateString("tr-TR")}
        </p>
      </div>
    </main>
  );
}
