// GET /api/portfolio/export?slug=... → yayınlanmış portfolyoyu seçilebilir-metinli
// PDF olarak render eder ve binary döner. PUBLIC (auth yok) — yalnızca published=true
// portfolyolar; içerik zaten public /p/[slug] sayfasında görünür. AI YOK → kredi düşmez.
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getLocale } from "next-intl/server";
import { NotFoundError, ValidationError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";
import { PortfolioDocument } from "@/lib/portfolio/pdf";
import type { Locale } from "@/i18n/detect";

// Dosya adı için güvenli slug (ASCII, tire).
function safeFileName(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return (base || "portfolio").slice(0, 60);
}

export const GET = withErrorHandler(async (req) => {
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) throw new ValidationError("slug gerekli.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("content")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError();

  const parsed = portfolioContentSchema.safeParse(data.content);
  if (!parsed.success) throw new NotFoundError();
  const content = parsed.data;

  const locale = (await getLocale()) as Locale;

  // react-pdf'in tipi kök öğenin <Document> olmasını bekler; PortfolioDocument bir
  // sarmalayıcı olduğundan tip köprüsü gerekir (runtime doğru — kök gerçekten Document).
  const element = createElement(PortfolioDocument, { content, locale }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(content.headline)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
