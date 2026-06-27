// /p/[slug] — genel portfolyo sayfası. Auth gerekmez; yalnızca published=true
// portfolyolar görünür. İçerik yapılandırılmış JSON; React metin render'ı
// otomatik escape eder (dangerouslySetInnerHTML kullanılmaz).
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select("content, updated_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) notFound();

  // Veritabanından gelen içeriği Zod ile doğrula.
  const parsed = portfolioContentSchema.safeParse(data.content);
  if (!parsed.success) notFound();

  const content = parsed.data;

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{content.headline}</h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Hakkında
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-neutral-800">{content.bio}</p>
        </section>

        {content.skills.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Beceriler
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
              Projeler
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
          Son güncelleme: {new Date(data.updated_at).toLocaleDateString("tr-TR")}
        </p>
      </div>
    </main>
  );
}
