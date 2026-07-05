// Dinamik OG görseli: avatar'ı OLMAYAN portfolyolar için sosyal paylaşım kartı
// fallback'i (LinkedIn/Twitter/Slack önizlemesi boş kalmasın → viral kayıp önlenir).
// generateMetadata avatar VARSA openGraph.images'i açıkça set eder ve o kazanır;
// avatar yoksa Next bu dosya-tabanlı görseli kullanır.
import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portfolioContentSchema } from "@/lib/validation/schemas/portfolio";
import { ACCENT_HEX } from "@/lib/portfolio/theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portfolio";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("portfolios")
    .select("content")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const parsed = data ? portfolioContentSchema.safeParse(data.content) : null;
  const content = parsed?.success ? parsed.data : null;
  const headline = content?.headline ?? "Multifolio";
  const skills = (content?.skills ?? []).slice(0, 5);
  const accent = ACCENT_HEX[content?.theme.accent ?? "blue"] ?? ACCENT_HEX.blue;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0A0B",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", height: "10px", width: "160px", background: accent, borderRadius: "9999px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: headline.length > 60 ? "56px" : "72px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1.1,
              maxWidth: "1000px",
            }}
          >
            {headline.slice(0, 110)}
          </div>
          {skills.length > 0 && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {skills.map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    color: accent,
                    border: `1px solid ${accent}`,
                    borderRadius: "9999px",
                    padding: "6px 20px",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "28px", color: "#A1A1AA" }}>
          <div style={{ display: "flex", fontWeight: 700, color: accent }}>M</div>
          Multifolio
        </div>
      </div>
    ),
    size,
  );
}
