// POST /api/cv/export → CV içeriğini ATS-güvenli, seçilebilir-metinli PDF olarak render
// eder ve binary döner. AI YOK → kredi düşmez. İstemci düzenlenmiş içeriği yollar
// (kaydetmeden de indirilebilsin). @react-pdf/renderer sunucuda renderToBuffer.
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { cvExportSchema } from "@/lib/validation/schemas/cv";
import { CvDocument } from "@/lib/cv/pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Dosya adı için güvenli slug (ASCII, tire).
function safeFileName(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return (base || "cv").slice(0, 60);
}

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { content } = await parseJson(req, cvExportSchema);

  // react-pdf'in tipi kök öğenin <Document> olmasını bekler; CvDocument bir sarmalayıcı
  // bileşen olduğundan tip köprüsü gerekir (runtime doğru — kök gerçekten Document).
  const element = createElement(CvDocument, { content }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(content.fullName)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
