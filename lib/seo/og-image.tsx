import { ImageResponse } from "next/og";

// Paylaşılan OG görsel (1200x630) render'ı — marka kartı (dark + cyan/violet).
// Her rota kendi opengraph-image.tsx'inde bunu başlık/alt başlıkla çağırır.
// Metin İngilizce (marka tutarlılığı; OG rotasında locale yok). satori kısıtı:
// çok çocuklu her div display:flex olmalı.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function renderOgImage({
  eyebrow, title, subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05070c 0%, #0b1220 55%, #130a20 100%)",
          padding: "72px 80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Marka */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 60, height: 60, borderRadius: 16,
              background: "rgba(0,240,255,0.15)", border: "2px solid rgba(0,240,255,0.45)",
              color: "#00F0FF", fontSize: 36, fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>Multifolio</div>
        </div>

        {/* Orta */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 3, color: "#00F0FF", marginBottom: 18 }}>
              {eyebrow.toUpperCase()}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>{title}</div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 30, color: "#94A3B8", marginTop: 26, maxWidth: 900, lineHeight: 1.35 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Alt */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: "#94A3B8" }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: "#00F0FF" }} />
          <div style={{ display: "flex" }}>Free tools · No sign-up · Pay-as-you-go</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
