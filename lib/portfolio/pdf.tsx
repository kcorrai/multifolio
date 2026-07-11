import "server-only";
// Portfolyonun tek-sayfa, seçilebilir-metinli PDF sürümü — @react-pdf/renderer.
// AI YOK → kredi düşmez. Public /p/[slug] sayfasındaki "PDF indir" butonu bunu
// çağırır (ziyaretçi paylaşılabilir bir dosya indirir). Görsel gömme/galeri
// resimleri PDF'e taşınmaz (metin + vaka-çalışması odaklı, hafif çıktı).
import path from "node:path";
import { Document, Page, Text, View, Link, Font } from "@react-pdf/renderer";
import type { PortfolioContent } from "@/lib/validation/schemas/portfolio";
import type { Locale } from "@/i18n/detect";
import { ACCENT_HEX } from "./theme";
import { validateContactEmail, validateContactUrl } from "./contact";

// TR karakter desteği için gömülü OpenSans (CV ile aynı fontlar; @react-pdf yerleşik
// Helvetica Latin-1 ile sınırlı ve ı/ğ/ş/İ/ç/ö/ü bozuyor).
const FONT_DIR = path.join(process.cwd(), "lib", "cv", "fonts");
let _fontsRegistered = false;
function ensureFonts() {
  if (_fontsRegistered) return;
  Font.register({ family: "PfSans", src: path.join(FONT_DIR, "OpenSans-Regular.ttf") });
  Font.register({ family: "PfSans-Bold", src: path.join(FONT_DIR, "OpenSans-Bold.ttf") });
  Font.registerHyphenationCallback((word) => [word]);
  _fontsRegistered = true;
}

const LABELS: Record<Locale, Record<string, string>> = {
  en: { about: "About", skills: "Skills", projects: "Projects", problem: "Problem", solution: "Solution", result: "Result", contact: "Contact" },
  tr: { about: "Hakkında", skills: "Beceriler", projects: "Projeler", problem: "Problem", solution: "Çözüm", result: "Sonuç", contact: "İletişim" },
};

const BOLD = "PfSans-Bold";
const REG = "PfSans";
const INK = "#1a1a1a";
const MUTED = "#555555";
const SUBTLE = "#6b7280";

// Bölüm başlığı (vurgu renkli, alt çizgi).
function Heading({ children, accent }: { children: string; accent: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: BOLD, color: accent, textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 6, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: accent }}>
      {children}
    </Text>
  );
}

// Vaka-çalışması satırı (Problem/Çözüm/Sonuç — doluysa etiketli).
function CaseLine({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 2 }}>
      <Text style={{ width: 54, fontSize: 8.5, fontFamily: BOLD, color: SUBTLE }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 9.5, color: "#222222" }}>{text}</Text>
    </View>
  );
}

export function PortfolioDocument({ content, locale }: { content: PortfolioContent; locale: Locale }) {
  ensureFonts();
  const L = LABELS[locale] ?? LABELS.en;
  const accent = ACCENT_HEX[content.theme.accent] ?? ACCENT_HEX.blue;
  const validEmail = validateContactEmail(content.contactEmail) ?? "";
  const validUrl = validateContactUrl(content.contactUrl) ?? "";

  return (
    <Document title={content.headline || "Portfolio"}>
      <Page size="A4" style={{ paddingVertical: 40, paddingHorizontal: 46, fontFamily: REG, fontSize: 10, color: INK, lineHeight: 1.45 }}>
        {/* Başlık bloğu */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 20, fontFamily: BOLD, color: INK, lineHeight: 1.15 }}>{content.headline}</Text>
        </View>

        {/* Hakkında */}
        {content.bio.trim() && (
          <View>
            <Heading accent={accent}>{L.about}</Heading>
            <Text style={{ fontSize: 9.5, color: "#222222" }}>{content.bio}</Text>
          </View>
        )}

        {/* Beceriler */}
        {content.skills.length > 0 && (
          <View>
            <Heading accent={accent}>{L.skills}</Heading>
            <Text style={{ fontSize: 9.5 }}>{content.skills.join("  ·  ")}</Text>
          </View>
        )}

        {/* Projeler (vaka-çalışması alanları doluysa Problem→Çözüm→Sonuç) */}
        {content.projects.length > 0 && (
          <View>
            <Heading accent={accent}>{L.projects}</Heading>
            {content.projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 9 }} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 10.5, fontFamily: BOLD }}>{p.title}</Text>
                  {p.url ? <Link src={p.url} style={{ color: accent, textDecoration: "none" }}><Text style={{ fontSize: 8.5 }}>{p.url.replace(/^https?:\/\//, "")}</Text></Link> : null}
                </View>
                {p.description ? <Text style={{ fontSize: 9.5, color: "#222222", marginTop: 1 }}>{p.description}</Text> : null}
                {p.problem?.trim() ? <CaseLine label={L.problem} text={p.problem} /> : null}
                {p.solution?.trim() ? <CaseLine label={L.solution} text={p.solution} /> : null}
                {p.result?.trim() ? <CaseLine label={L.result} text={p.result} /> : null}
              </View>
            ))}
          </View>
        )}

        {/* İletişim */}
        {(validEmail || validUrl) && (
          <View>
            <Heading accent={accent}>{L.contact}</Heading>
            {validEmail ? <Text style={{ fontSize: 9.5, color: MUTED }}>{validEmail}</Text> : null}
            {validUrl ? <Link src={validUrl} style={{ color: accent, textDecoration: "none" }}><Text style={{ fontSize: 9.5 }}>{validUrl.replace(/^https?:\/\//, "")}</Text></Link> : null}
          </View>
        )}
      </Page>
    </Document>
  );
}
