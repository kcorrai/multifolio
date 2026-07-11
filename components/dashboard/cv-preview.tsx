"use client";

// CV canlı önizleme (HTML) — PDF çıktısının (lib/cv/pdf.tsx) ekran karşılığı. Kullanıcı
// şablon/vurgu seçince anında görür. 4 şablon (sidebar/banner/monogram/clean) PDF ile
// GÖRSEL OLARAK EŞLEŞİR (aynı CV_ACCENT_HEX/TINT + düzen mantığı).
import type { CvContent } from "@/lib/validation/schemas/cv";
import { CV_ACCENT_HEX, CV_ACCENT_TINT, CV_SINGLE_COLUMN, initialsOf, type CvHeadingDecoration } from "@/lib/cv/theme";

const INK = "#1a1a1a";

const LABELS: Record<string, Record<string, string>> = {
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

const MUTED = "#555";
const SUBTLE = "#6b7280";

// Bölüm başlığı — renk + dekorasyon parametreli (PDF CvHeading ile GÖRSEL EŞLEŞİR).
function cvHead(title: string, color: string, decoration: CvHeadingDecoration = "underline") {
  if (decoration === "leftbar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "12px", marginBottom: "6px" }}>
        <span style={{ width: "3px", height: "11px", background: color, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "1px" }}>{title}</span>
      </div>
    );
  }
  const border = decoration === "plain" ? "0.75px solid #B0B0B0" : `1px solid ${color}`;
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "6px", borderBottom: border, paddingBottom: "2px" }}>
      {title}
    </div>
  );
}

// Görsel şablonlar için kısayol (vurgu + alt çizgi — eski davranış).
function mainHead(title: string, accent: string) {
  return cvHead(title, accent, "underline");
}

function bullets(items: string[], color: string) {
  return items.filter((b) => b.trim()).map((b, i) => (
    <div key={i} style={{ display: "flex", gap: "5px", marginTop: "2px" }}>
      <span style={{ color, flexShrink: 0 }}>•</span>
      <span style={{ flex: 1, color: "#222" }}>{b}</span>
    </div>
  ));
}

// Ana içerik: özet + deneyim + eğitim + projeler. Başlık rengi/dekorasyonu
// parametreli (görsel şablonlar için varsayılan: vurgu + alt çizgi).
function MainSections({
  content, L, accent, headingColor = accent, headingDecoration = "underline",
}: {
  content: CvContent; L: Record<string, string>; accent: string;
  headingColor?: string; headingDecoration?: CvHeadingDecoration;
}) {
  return (
    <>
      {content.summary.trim() && (<div>{cvHead(L.summary, headingColor, headingDecoration)}<p style={{ color: "#222" }}>{content.summary}</p></div>)}
      {content.experience.length > 0 && (
        <div>{cvHead(L.experience, headingColor, headingDecoration)}
          {content.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: 700 }}>{[e.role, e.company].filter(Boolean).join(" — ")}</span>
                <span style={{ color: SUBTLE, fontSize: "8.5px", whiteSpace: "nowrap" }}>{[e.startDate, e.current ? L.present : e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              {e.location && <div style={{ color: MUTED, fontSize: "9px" }}>{e.location}</div>}
              {bullets(e.bullets, accent)}
            </div>
          ))}
        </div>
      )}
      {content.education.length > 0 && (
        <div>{cvHead(L.education, headingColor, headingDecoration)}
          {content.education.map((e, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: 700 }}>{[e.degree, e.field].filter(Boolean).join(", ")}</span>
                <span style={{ color: SUBTLE, fontSize: "8.5px", whiteSpace: "nowrap" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              {e.school && <div style={{ color: MUTED, fontSize: "9px" }}>{e.school}</div>}
            </div>
          ))}
        </div>
      )}
      {content.projects.length > 0 && (
        <div>{cvHead(L.projects, headingColor, headingDecoration)}
          {content.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
                {p.url && <span style={{ color: accent, fontSize: "8.5px" }}>{p.url.replace(/^https?:\/\//, "")}</span>}
              </div>
              {p.description && <p style={{ color: "#222" }}>{p.description}</p>}
              {bullets(p.bullets, accent)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Kenar çubuğu öğeleri (renkli/açık zemine göre metin rengi + başlık).
function SideItems({
  content, L, textColor, headColor, headBorder,
}: {
  content: CvContent; L: Record<string, string>; textColor: string; headColor: string; headBorder: string;
}) {
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());
  const allSkills = [...content.skills.hard, ...content.skills.soft].filter((x) => x.trim());
  const head = (t: string) => (
    <div style={{ fontSize: "10px", fontWeight: 700, color: headColor, textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "5px", borderBottom: headBorder, paddingBottom: "2px" }}>{t}</div>
  );
  const line = (x: string, i: number) => <div key={i} style={{ fontSize: "8.5px", color: textColor, marginBottom: "2px" }}>{x}</div>;
  return (
    <>
      {contactParts.length > 0 && <div>{head(L.contact)}{contactParts.map(line)}</div>}
      {allSkills.length > 0 && <div>{head(L.skills)}{allSkills.map(line)}</div>}
      {content.languages.length > 0 && <div>{head(L.languages)}{content.languages.map((l, i) => line(l.name + (l.level ? ` — ${l.level}` : ""), i))}</div>}
      {content.certifications.length > 0 && <div>{head(L.certifications)}{content.certifications.map((x, i) => line([x.name, x.issuer, x.date].filter(Boolean).join(" — "), i))}</div>}
    </>
  );
}

export function CvPreview({ content }: { content: CvContent }) {
  const L = LABELS[content.locale] ?? LABELS.en;
  const accent = CV_ACCENT_HEX[content.theme.accent] ?? CV_ACCENT_HEX.blue;
  const tint = CV_ACCENT_TINT[content.theme.accent] ?? CV_ACCENT_TINT.blue;
  const tpl = content.theme.template;
  const c = content.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter((x) => x.trim());
  const allSkills = [...content.skills.hard, ...content.skills.soft].filter((x) => x.trim());

  const paper = "mx-auto w-full max-w-[600px] rounded-md bg-white text-[#1a1a1a] shadow-lg ring-1 ring-black/5 overflow-hidden";
  const base = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", lineHeight: 1.45 } as const;

  // Tek-sütun ATS şablonları (clean/classic/minimal/modern/compact) — CV_SINGLE_COLUMN
  // config'iyle tek yol; PDF ile GÖRSEL EŞLEŞİR (padding PDF pt'sinin ~0.8'i).
  const single = CV_SINGLE_COLUMN[tpl];
  if (single) {
    const headingColor = single.accentHeadings ? accent : INK;
    const nameColor = single.nameAccent ? accent : INK;
    const dec = single.headingDecoration;
    const padV = Math.round(single.padV * 0.8);
    const padH = Math.round(single.padH * 0.8);
    return (
      <div className={paper} style={{ ...base, padding: `${padV}px ${padH}px` }}>
        <div style={{ textAlign: single.headerAlign, marginBottom: "6px" }}>
          {content.fullName && <div style={{ fontSize: `${single.namePt + 1}px`, fontWeight: 700, color: nameColor, lineHeight: 1.15 }}>{content.fullName}</div>}
          {content.title && <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{content.title}</div>}
          {contactParts.length > 0 && <div style={{ fontSize: "9px", color: SUBTLE, marginTop: "4px" }}>{contactParts.join("  ·  ")}</div>}
        </div>
        <MainSections content={content} L={L} accent={accent} headingColor={headingColor} headingDecoration={dec} />
        {allSkills.length > 0 && (<div>{cvHead(L.skills, headingColor, dec)}<p>{allSkills.join(", ")}</p></div>)}
        {content.certifications.length > 0 && (<div>{cvHead(L.certifications, headingColor, dec)}{content.certifications.map((x, i) => <div key={i}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</div>)}</div>)}
        {content.languages.length > 0 && (<div>{cvHead(L.languages, headingColor, dec)}<p>{content.languages.map((l) => l.name + (l.level ? ` (${l.level})` : "")).join(", ")}</p></div>)}
      </div>
    );
  }

  // banner: renkli üst bant + iki sütun
  if (tpl === "banner") {
    return (
      <div className={paper} style={base}>
        <div style={{ backgroundColor: accent, color: "#fff", padding: "22px 32px" }}>
          {content.fullName && <div style={{ fontSize: "24px", fontWeight: 700 }}>{content.fullName}</div>}
          {content.title && <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.9 }}>{content.title}</div>}
          {contactParts.length > 0 && <div style={{ fontSize: "8.5px", marginTop: "6px", opacity: 0.9 }}>{contactParts.join("  ·  ")}</div>}
        </div>
        <div style={{ display: "flex", padding: "18px 32px 26px" }}>
          <div style={{ width: "32%", paddingRight: "14px" }}>
            {allSkills.length > 0 && (<div>{mainHead(L.skills, accent)}{allSkills.map((x, i) => <div key={i} style={{ marginBottom: "2px", fontSize: "9px" }}>{x}</div>)}</div>)}
            {content.languages.length > 0 && (<div>{mainHead(L.languages, accent)}{content.languages.map((l, i) => <div key={i} style={{ marginBottom: "2px", fontSize: "9px" }}>{l.name + (l.level ? ` — ${l.level}` : "")}</div>)}</div>)}
            {content.certifications.length > 0 && (<div>{mainHead(L.certifications, accent)}{content.certifications.map((x, i) => <div key={i} style={{ marginBottom: "3px", fontSize: "9px" }}>{[x.name, x.issuer, x.date].filter(Boolean).join(" — ")}</div>)}</div>)}
          </div>
          <div style={{ width: "68%", paddingLeft: "6px" }}>
            <MainSections content={content} L={L} accent={accent} />
          </div>
        </div>
      </div>
    );
  }

  // sidebar / monogram
  const monogram = tpl === "monogram";
  const sideBg = monogram ? tint : accent;
  const sideText = monogram ? "#333" : "#E5E7EB";
  const sideHead = monogram ? accent : "#fff";
  const sideBorder = monogram ? "none" : "0.75px solid rgba(255,255,255,0.35)";
  const sidebar = (
    <div style={{ width: "34%", backgroundColor: sideBg, padding: "24px 16px" }}>
      {monogram && content.fullName && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700 }}>
            {initialsOf(content.fullName)}
          </div>
        </div>
      )}
      <SideItems content={content} L={L} textColor={sideText} headColor={sideHead} headBorder={sideBorder} />
    </div>
  );
  const main = (
    <div style={{ width: "66%", padding: "24px 20px" }}>
      {content.fullName && <div style={{ fontSize: "22px", fontWeight: 700, color: accent }}>{content.fullName}</div>}
      {content.title && <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px", marginBottom: "2px" }}>{content.title}</div>}
      <MainSections content={content} L={L} accent={accent} />
    </div>
  );

  return (
    <div className={paper} style={{ ...base, display: "flex", flexDirection: monogram ? "row-reverse" : "row", alignItems: "stretch" }}>
      {sidebar}
      {main}
    </div>
  );
}
