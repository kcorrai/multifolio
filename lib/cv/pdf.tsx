import "server-only";
// Görsel olarak zengin, ATS için seçilebilir-metinli PDF özgeçmiş — @react-pdf/renderer.
// 4 şablon: sidebar (renkli sol kenar çubuğu), banner (renkli üst bant), monogram
// (baş harf avatarlı sağ kenar çubuğu), clean (tek sütun — en ATS-güvenli).
// Fontlar @react-pdf yerleşik (Helvetica) → harici indirme yok. Metin rasterize DEĞİL.
import path from "node:path";
import { Document, Page, Text, View, Link, Font } from "@react-pdf/renderer";
import type { CvContent } from "@/lib/validation/schemas/cv";
import type { Locale } from "@/i18n/detect";
import { CV_ACCENT_HEX, CV_ACCENT_TINT, CV_SINGLE_COLUMN, initialsOf, type CvHeadingDecoration } from "./theme";

// Türkçe (ı/ğ/ş/İ/ç/ö/ü) destekli font — @react-pdf yerleşik Helvetica'sı Latin-1 ile
// sınırlı ve TR karakterleri bozuyor. Roboto TTF gömülü (lib/cv/fonts, repo'da).
const FONT_DIR = path.join(process.cwd(), "lib", "cv", "fonts");
let _fontsRegistered = false;
function ensureFonts() {
  if (_fontsRegistered) return;
  Font.register({ family: "CVSans", src: path.join(FONT_DIR, "OpenSans-Regular.ttf") });
  Font.register({ family: "CVSans-Bold", src: path.join(FONT_DIR, "OpenSans-Bold.ttf") });
  // Uzun URL/kelimelerde tireli bölmeyi kapat (CV'de istenmez).
  Font.registerHyphenationCallback((word) => [word]);
  _fontsRegistered = true;
}

const LABELS: Record<Locale, Record<string, string>> = {
  en: {
    contact: "Contact", summary: "Profile", skills: "Skills", experience: "Work Experience",
    education: "Education", projects: "Projects", certifications: "Certifications",
    languages: "Languages", present: "Present",
  },
  tr: {
    contact: "İletişim", summary: "Profil", skills: "Beceriler", experience: "İş Deneyimi",
    education: "Eğitim", projects: "Projeler", certifications: "Sertifikalar",
    languages: "Diller", present: "Halen",
  },
};

const BOLD = "CVSans-Bold";
const REG = "CVSans";
const INK = "#1a1a1a";
const MUTED = "#555555";
const SUBTLE = "#6b7280";

/* ── Ortak küçük parçalar ─────────────────────────────────────────── */

// Kenar çubuğu başlığı (beyaz metin, alt çizgi).
function SideHeading({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 10, fontFamily: BOLD, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 5, borderBottomWidth: 0.75, borderBottomColor: "rgba(255,255,255,0.35)", paddingBottom: 2 }}>
      {children}
    </Text>
  );
}

// Ana bölüm başlığı — renk + dekorasyon parametreli (underline/leftbar/plain).
// Tek-sütun ATS şablonları farklı stil için bunu doğrudan kullanır.
function CvHeading({ children, color, decoration = "underline" }: { children: string; color: string; decoration?: CvHeadingDecoration }) {
  if (decoration === "leftbar") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 }}>
        <View style={{ width: 3, height: 10, backgroundColor: color, marginRight: 5 }} />
        <Text style={{ fontSize: 11, fontFamily: BOLD, color, textTransform: "uppercase", letterSpacing: 1 }}>{children}</Text>
      </View>
    );
  }
  const border = decoration === "plain"
    ? { borderBottomWidth: 0.75, borderBottomColor: "#B0B0B0" }
    : { borderBottomWidth: 1, borderBottomColor: color };
  return (
    <Text style={{ fontSize: 11, fontFamily: BOLD, color, textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 6, paddingBottom: 2, ...border }}>
      {children}
    </Text>
  );
}

// Görsel şablonlar için kısayol (vurgu renkli, alt çizgi — eski davranış).
function MainHeading({ children, accent }: { children: string; accent: string }) {
  return <CvHeading color={accent} decoration="underline">{children}</CvHeading>;
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 2, paddingLeft: 2 }}>
      <Text style={{ width: 9, fontSize: 9, color }}>•</Text>
      <Text style={{ flex: 1, fontSize: 9.5, color: "#222222" }}>{text}</Text>
    </View>
  );
}

// Kenar çubuğu içeriği: iletişim + beceriler + diller + sertifikalar (beyaz/açık metin).
function SidebarContent({ content, L }: { content: CvContent; L: Record<string, string> }) {
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());
  const light = "#E5E7EB";
  return (
    <>
      {contactParts.length > 0 && (
        <View>
          <SideHeading>{L.contact}</SideHeading>
          {contactParts.map((x, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: light, marginBottom: 2 }}>{x}</Text>
          ))}
        </View>
      )}
      {content.skills.hard.length + content.skills.soft.length > 0 && (
        <View>
          <SideHeading>{L.skills}</SideHeading>
          {[...content.skills.hard, ...content.skills.soft].filter((x) => x.trim()).map((x, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: light, marginBottom: 2 }}>{x}</Text>
          ))}
        </View>
      )}
      {content.languages.length > 0 && (
        <View>
          <SideHeading>{L.languages}</SideHeading>
          {content.languages.map((l, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: light, marginBottom: 2 }}>{l.name + (l.level ? ` — ${l.level}` : "")}</Text>
          ))}
        </View>
      )}
      {content.certifications.length > 0 && (
        <View>
          <SideHeading>{L.certifications}</SideHeading>
          {content.certifications.map((x, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: light, marginBottom: 2 }}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</Text>
          ))}
        </View>
      )}
    </>
  );
}

// Ana içerik: özet + deneyim + eğitim + projeler. Başlık rengi/dekorasyonu
// parametreli (görsel şablonlar için varsayılan: vurgu + alt çizgi).
function MainContent({
  content, L, accent, headingColor = accent, headingDecoration = "underline",
}: {
  content: CvContent; L: Record<string, string>; accent: string;
  headingColor?: string; headingDecoration?: CvHeadingDecoration;
}) {
  return (
    <>
      {content.summary.trim() && (
        <View>
          <CvHeading color={headingColor} decoration={headingDecoration}>{L.summary}</CvHeading>
          <Text style={{ fontSize: 9.5, color: "#222222" }}>{content.summary}</Text>
        </View>
      )}
      {content.experience.length > 0 && (
        <View>
          <CvHeading color={headingColor} decoration={headingDecoration}>{L.experience}</CvHeading>
          {content.experience.map((e, i) => (
            <View key={i} style={{ marginBottom: 8 }} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 10, fontFamily: BOLD }}>{[e.role, e.company].filter(Boolean).join(" — ")}</Text>
                <Text style={{ fontSize: 8.5, color: SUBTLE }}>{[e.startDate, e.current ? L.present : e.endDate].filter(Boolean).join(" – ")}</Text>
              </View>
              {e.location ? <Text style={{ fontSize: 9, color: MUTED }}>{e.location}</Text> : null}
              {e.bullets.map((b, j) => <Bullet key={j} text={b} color={accent} />)}
            </View>
          ))}
        </View>
      )}
      {content.education.length > 0 && (
        <View>
          <CvHeading color={headingColor} decoration={headingDecoration}>{L.education}</CvHeading>
          {content.education.map((e, i) => (
            <View key={i} style={{ marginBottom: 6 }} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 10, fontFamily: BOLD }}>{[e.degree, e.field].filter(Boolean).join(", ")}</Text>
                <Text style={{ fontSize: 8.5, color: SUBTLE }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</Text>
              </View>
              {e.school ? <Text style={{ fontSize: 9, color: MUTED }}>{e.school}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {content.projects.length > 0 && (
        <View>
          <CvHeading color={headingColor} decoration={headingDecoration}>{L.projects}</CvHeading>
          {content.projects.map((p, i) => (
            <View key={i} style={{ marginBottom: 8 }} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 10, fontFamily: BOLD }}>{p.name}</Text>
                {p.url ? <Link src={p.url} style={{ color: accent, textDecoration: "none" }}><Text style={{ fontSize: 8.5 }}>{p.url.replace(/^https?:\/\//, "")}</Text></Link> : null}
              </View>
              {p.description ? <Text style={{ fontSize: 9.5, color: "#222222" }}>{p.description}</Text> : null}
              {p.bullets.map((b, j) => <Bullet key={j} text={b} color={accent} />)}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function NameBlock({ content, color, align = "left", namePt = 21 }: { content: CvContent; color: string; align?: "left" | "center"; namePt?: number }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {content.fullName ? <Text style={{ fontSize: namePt, fontFamily: BOLD, color, lineHeight: 1.15, textAlign: align }}>{content.fullName}</Text> : null}
      {content.title ? <Text style={{ fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.2, textAlign: align }}>{content.title}</Text> : null}
    </View>
  );
}

/* ── Ana bileşen ──────────────────────────────────────────────────── */

export function CvDocument({ content }: { content: CvContent }) {
  ensureFonts();
  const L = LABELS[content.locale] ?? LABELS.en;
  const accent = CV_ACCENT_HEX[content.theme.accent] ?? CV_ACCENT_HEX.blue;
  const tint = CV_ACCENT_TINT[content.theme.accent] ?? CV_ACCENT_TINT.blue;
  const tpl = content.theme.template;
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());

  // ── Tek-sütun ATS şablonları (clean/classic/minimal/modern/compact) ──
  // Tümü CV_SINGLE_COLUMN config'iyle tek render yolundan; stil parametrelerle ayrışır.
  const single = CV_SINGLE_COLUMN[tpl];
  if (single) {
    const headingColor = single.accentHeadings ? accent : INK;
    const nameColor = single.nameAccent ? accent : INK;
    const align = single.headerAlign;
    const dec = single.headingDecoration;
    return (
      <Document title={content.fullName || "CV"} author={content.fullName || undefined}>
        <Page size="A4" style={{ paddingVertical: single.padV, paddingHorizontal: single.padH, fontFamily: REG, fontSize: 10, color: INK, lineHeight: 1.4 }}>
          <View style={{ marginBottom: 6 }}>
            <NameBlock content={content} color={nameColor} align={align} namePt={single.namePt} />
            {contactParts.length > 0 ? <Text style={{ fontSize: 9, color: SUBTLE, textAlign: align, marginTop: 4 }}>{contactParts.join("  ·  ")}</Text> : null}
          </View>
          <MainContent content={content} L={L} accent={accent} headingColor={headingColor} headingDecoration={dec} />
          {content.skills.hard.length + content.skills.soft.length > 0 && (
            <View>
              <CvHeading color={headingColor} decoration={dec}>{L.skills}</CvHeading>
              <Text style={{ fontSize: 9.5 }}>{[...content.skills.hard, ...content.skills.soft].filter((x) => x.trim()).join(", ")}</Text>
            </View>
          )}
          {content.certifications.length > 0 && (
            <View>
              <CvHeading color={headingColor} decoration={dec}>{L.certifications}</CvHeading>
              {content.certifications.map((x, i) => <Text key={i} style={{ fontSize: 9.5, color: "#222" }}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</Text>)}
            </View>
          )}
          {content.languages.length > 0 && (
            <View>
              <CvHeading color={headingColor} decoration={dec}>{L.languages}</CvHeading>
              <Text style={{ fontSize: 9.5 }}>{content.languages.map((l) => l.name + (l.level ? ` (${l.level})` : "")).join(", ")}</Text>
            </View>
          )}
        </Page>
      </Document>
    );
  }

  // ── banner: renkli üst bant + iki sütun gövde ──
  if (tpl === "banner") {
    return (
      <Document title={content.fullName || "CV"} author={content.fullName || undefined}>
        <Page size="A4" style={{ fontFamily: REG, fontSize: 10, color: INK, lineHeight: 1.4 }}>
          <View style={{ backgroundColor: accent, paddingVertical: 24, paddingHorizontal: 40 }}>
            {content.fullName ? <Text style={{ fontSize: 23, fontFamily: BOLD, color: "#FFFFFF", lineHeight: 1.15 }}>{content.fullName}</Text> : null}
            {content.title ? <Text style={{ fontSize: 12, color: "#FFFFFF", marginTop: 3, lineHeight: 1.2, opacity: 0.9 }}>{content.title}</Text> : null}
            {contactParts.length > 0 ? <Text style={{ fontSize: 8.5, color: "#FFFFFF", marginTop: 6, opacity: 0.9 }}>{contactParts.join("  ·  ")}</Text> : null}
          </View>
          <View style={{ flexDirection: "row", paddingHorizontal: 40, paddingVertical: 20 }}>
            <View style={{ width: "32%", paddingRight: 14 }}>
              {content.skills.hard.length + content.skills.soft.length > 0 && (
                <View>
                  <MainHeading accent={accent}>{L.skills}</MainHeading>
                  {[...content.skills.hard, ...content.skills.soft].filter((x) => x.trim()).map((x, i) => <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>{x}</Text>)}
                </View>
              )}
              {content.languages.length > 0 && (
                <View>
                  <MainHeading accent={accent}>{L.languages}</MainHeading>
                  {content.languages.map((l, i) => <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>{l.name + (l.level ? ` — ${l.level}` : "")}</Text>)}
                </View>
              )}
              {content.certifications.length > 0 && (
                <View>
                  <MainHeading accent={accent}>{L.certifications}</MainHeading>
                  {content.certifications.map((x, i) => <Text key={i} style={{ fontSize: 9, marginBottom: 3 }}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</Text>)}
                </View>
              )}
            </View>
            <View style={{ width: "68%", paddingLeft: 6 }}>
              <MainContent content={content} L={L} accent={accent} />
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  // ── sidebar / monogram: renkli sol / açık sağ kenar çubuğu ──
  const monogram = tpl === "monogram";
  const sideWidth = "34%";
  const sideBg = monogram ? tint : accent;
  const sideOnLeft = !monogram;
  const initials = initialsOf(content.fullName);

  return (
    <Document title={content.fullName || "CV"} author={content.fullName || undefined}>
      <Page size="A4" style={{ fontFamily: REG, fontSize: 10, color: INK, lineHeight: 1.4 }}>
        {/* Tam boy kenar çubuğu arka planı (her sayfada) */}
        <View fixed style={{ position: "absolute", top: 0, bottom: 0, [sideOnLeft ? "left" : "right"]: 0, width: sideWidth, backgroundColor: sideBg }} />
        <View style={{ flexDirection: sideOnLeft ? "row" : "row-reverse" }}>
          {/* Kenar çubuğu */}
          <View style={{ width: sideWidth, paddingVertical: 28, paddingHorizontal: 18 }}>
            {monogram && (
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20, fontFamily: BOLD, color: "#FFFFFF" }}>{initials}</Text>
                </View>
              </View>
            )}
            {monogram ? <MonogramSidebar content={content} L={L} accent={accent} /> : <SidebarContent content={content} L={L} />}
          </View>
          {/* Ana sütun */}
          <View style={{ width: "66%", paddingVertical: 28, paddingHorizontal: 22 }}>
            <NameBlock content={content} color={accent} />
            <MainContent content={content} L={L} accent={accent} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Monogram kenar çubuğu (açık zemin → koyu metin + vurgu başlık).
function MonogramSidebar({ content, L, accent }: { content: CvContent; L: Record<string, string>; accent: string }) {
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());
  const head = (t: string) => (
    <Text style={{ fontSize: 10, fontFamily: BOLD, color: accent, textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 5 }}>{t}</Text>
  );
  return (
    <>
      {contactParts.length > 0 && (<View>{head(L.contact)}{contactParts.map((x, i) => <Text key={i} style={{ fontSize: 8.5, color: "#333", marginBottom: 2 }}>{x}</Text>)}</View>)}
      {content.skills.hard.length + content.skills.soft.length > 0 && (<View>{head(L.skills)}{[...content.skills.hard, ...content.skills.soft].filter((x) => x.trim()).map((x, i) => <Text key={i} style={{ fontSize: 8.5, color: "#333", marginBottom: 2 }}>{x}</Text>)}</View>)}
      {content.languages.length > 0 && (<View>{head(L.languages)}{content.languages.map((l, i) => <Text key={i} style={{ fontSize: 8.5, color: "#333", marginBottom: 2 }}>{l.name + (l.level ? ` — ${l.level}` : "")}</Text>)}</View>)}
      {content.certifications.length > 0 && (<View>{head(L.certifications)}{content.certifications.map((x, i) => <Text key={i} style={{ fontSize: 8.5, color: "#333", marginBottom: 3 }}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</Text>)}</View>)}
    </>
  );
}
