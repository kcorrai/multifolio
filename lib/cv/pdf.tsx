import "server-only";
// ATS-güvenli PDF özgeçmiş — @react-pdf/renderer ile TEK SÜTUN, SEÇİLEBİLİR METİN
// (rasterize DEĞİL → ATS ayrıştırır). Tablo/kolon/grafik/ikon YOK. Standart font
// (Helvetica — @react-pdf yerleşik, harici font indirmeye gerek yok). İletişim bilgisi
// akış içinde (header/footer'da DEĞİL — ATS bazen header'ı atlar).
import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import type { CvContent } from "@/lib/validation/schemas/cv";
import type { Locale } from "@/i18n/detect";

// Bölüm başlıkları (standart ATS başlıkları — İngilizce ATS'ler bunları tanır).
const LABELS: Record<Locale, Record<string, string>> = {
  en: {
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Work Experience",
    education: "Education",
    projects: "Projects",
    certifications: "Certifications",
    languages: "Languages",
    present: "Present",
  },
  tr: {
    summary: "Profesyonel Özet",
    skills: "Beceriler",
    experience: "İş Deneyimi",
    education: "Eğitim",
    projects: "Projeler",
    certifications: "Sertifikalar",
    languages: "Diller",
    present: "Halen",
  },
};

const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a", lineHeight: 1.4 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  title: { fontSize: 11, color: "#444", marginBottom: 6 },
  contactLine: { fontSize: 9, color: "#333", marginBottom: 2 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase",
    letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: "#999999",
    borderBottomStyle: "solid", paddingBottom: 2, marginBottom: 6,
  },
  entry: { marginBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  entrySub: { fontSize: 9.5, color: "#444" },
  entryDate: { fontSize: 9, color: "#666" },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 9.5 },
  para: { fontSize: 9.5, color: "#222" },
  skillsLine: { fontSize: 9.5 },
  link: { color: "#1a1a1a", textDecoration: "none" },
});

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function CvDocument({ content }: { content: CvContent }) {
  const L = LABELS[content.locale] ?? LABELS.en;
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());
  const hasExp = content.experience.length > 0;
  const hasEdu = content.education.length > 0;
  const hasProj = content.projects.length > 0;
  const hasCerts = content.certifications.length > 0;
  const hasLangs = content.languages.length > 0;
  const allSkills = [...content.skills.hard, ...content.skills.soft].filter((x) => x.trim());

  return (
    <Document title={content.fullName || "CV"} author={content.fullName || undefined}>
      <Page size="A4" style={s.page}>
        {/* Header — akış içinde (ATS için) */}
        {content.fullName ? <Text style={s.name}>{content.fullName}</Text> : null}
        {content.title ? <Text style={s.title}>{content.title}</Text> : null}
        {contactParts.length > 0 ? <Text style={s.contactLine}>{contactParts.join("  ·  ")}</Text> : null}

        {content.summary.trim() ? (
          <Section title={L.summary}>
            <Text style={s.para}>{content.summary}</Text>
          </Section>
        ) : null}

        {allSkills.length > 0 ? (
          <Section title={L.skills}>
            <Text style={s.skillsLine}>{allSkills.join(", ")}</Text>
          </Section>
        ) : null}

        {hasExp ? (
          <Section title={L.experience}>
            {content.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>
                    {[e.role, e.company].filter(Boolean).join(" — ")}
                  </Text>
                  <Text style={s.entryDate}>
                    {[e.startDate, e.current ? L.present : e.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.location ? <Text style={s.entrySub}>{e.location}</Text> : null}
                {e.bullets.map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </Section>
        ) : null}

        {hasEdu ? (
          <Section title={L.education}>
            {content.education.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>
                    {[e.degree, e.field].filter(Boolean).join(", ")}
                  </Text>
                  <Text style={s.entryDate}>
                    {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.school ? <Text style={s.entrySub}>{e.school}</Text> : null}
              </View>
            ))}
          </Section>
        ) : null}

        {hasProj ? (
          <Section title={L.projects}>
            {content.projects.map((p, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{p.name}</Text>
                  {p.url ? (
                    <Link src={p.url} style={s.link}>
                      <Text style={s.entryDate}>{p.url.replace(/^https?:\/\//, "")}</Text>
                    </Link>
                  ) : null}
                </View>
                {p.description ? <Text style={s.para}>{p.description}</Text> : null}
                {p.bullets.map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </Section>
        ) : null}

        {hasCerts ? (
          <Section title={L.certifications}>
            {content.certifications.map((c2, i) => (
              <Text key={i} style={s.para}>
                {[c2.name, c2.issuer, c2.date].filter(Boolean).join(" — ")}
              </Text>
            ))}
          </Section>
        ) : null}

        {hasLangs ? (
          <Section title={L.languages}>
            <Text style={s.skillsLine}>
              {content.languages.map((l) => [l.name, l.level].filter(Boolean).join(" (") + (l.level ? ")" : "")).join(", ")}
            </Text>
          </Section>
        ) : null}
      </Page>
    </Document>
  );
}
