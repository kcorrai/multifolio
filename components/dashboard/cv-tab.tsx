"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles, Upload, Save, Check, AlertCircle, Download, Wand2, Plus, X, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { scoreCv, atsVerdict } from "@/lib/cv/ats";
import type {
  CvContent, CvExperience, CvEducation, CvProject, CvCertification, CvLanguage,
} from "@/lib/validation/schemas/cv";
import { ELEVATED, type InitialCv, type CvJobOption } from "./shared";
import { useDashboard } from "./dashboard-context";

const emptyExperience: CvExperience = {
  company: "", role: "", location: "", startDate: "", endDate: "", current: false, bullets: [],
};
const emptyEducation: CvEducation = { school: "", degree: "", field: "", startDate: "", endDate: "" };
const emptyProject: CvProject = { name: "", description: "", bullets: [], url: "" };
const emptyCert: CvCertification = { name: "", issuer: "", date: "" };
const emptyLang: CvLanguage = { name: "", level: "" };

export function CvTab({
  profileSaved, initialCv, jobs,
}: {
  profileSaved: boolean;
  initialCv: InitialCv;
  jobs: CvJobOption[];
}) {
  const { applyCredits, triggerComingSoon } = useDashboard();
  const t = useTranslations("cv");
  const [content, setContent] = useState<CvContent | null>(initialCv.content);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ats = useMemo(() => (content ? scoreCv(content) : null), [content]);

  // Değişiklik + kaydedilmemiş işaretle.
  function patch(next: Partial<CvContent>) {
    setContent((prev) => (prev ? { ...prev, ...next } : prev));
    setDirty(true);
  }

  async function generate() {
    setGenerating(true); setError("");
    const res = await fetch("/api/cv/generate", { method: "POST" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("errorGenerate"));
      if (res.status === 402) triggerComingSoon();
      setGenerating(false); return;
    }
    setContent(body.cv.content); setDirty(false);
    if (body.credits) applyCredits(body.credits);
    setGenerating(false);
  }

  async function upload(file: File) {
    setUploading(true); setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/cv/import", { method: "POST", body: form });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("errorUpload")); setUploading(false); return; }
    setContent(body.content); setDirty(true); // taslak — kullanıcı gözden geçirip kaydeder
    setUploading(false);
  }

  async function save() {
    if (!content) return;
    setSaving(true); setError("");
    const res = await fetch("/api/cv", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("errorGenerate")); setSaving(false); return; }
    setContent(body.cv.content); setDirty(false);
    setSaving(false);
  }

  async function tailor() {
    if (!selectedJob) return;
    setTailoring(true); setError("");
    const res = await fetch("/api/cv/tailor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: selectedJob }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("tailorError"));
      if (res.status === 402) triggerComingSoon();
      setTailoring(false); return;
    }
    setContent(body.content); setDirty(true);
    if (body.credits) applyCredits(body.credits);
    setTailoring(false);
  }

  async function download() {
    if (!content) return;
    setDownloading(true); setError("");
    try {
      const res = await fetch("/api/cv/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) { setError(t("downloadError")); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(content.fullName || "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!profileSaved && !content && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />{t("saveProfileFirst")}
            </div>
          )}

          {/* ── Giriş: üret veya yükle ─────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generate} disabled={generating || (!profileSaved && !content)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {generating ? t("generating") : content ? t("regenerate") : t("generate")}
              <CreditCost kind="cv_generation" />
            </Button>
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? t("uploading") : t("uploadCta")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = ""; // aynı dosya tekrar seçilebilsin
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {!content && !error && (
            <p className="text-sm text-muted-foreground border-t pt-5">{t("empty")}</p>
          )}
        </CardContent>
      </Card>

      {content && (
        <>
          <AtsPanel ats={ats!} />

          {/* ── İşe göre uyarla ──────────────────────────────────── */}
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4" />{t("tailorTitle")}</CardTitle>
              <CardDescription>{t("tailorHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("tailorNoJobs")}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring max-w-xs"
                  >
                    <option value="">{t("tailorSelectJob")}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.title || j.id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <Button onClick={tailor} disabled={tailoring || !selectedJob} className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    {tailoring ? t("tailoring") : t("tailorCta")}
                    <CreditCost kind="cv_tailor" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Editör ───────────────────────────────────────────── */}
          <CvEditor content={content} patch={patch} />

          {/* ── Kaydet / indir ───────────────────────────────────── */}
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <Button onClick={save} disabled={saving || !dirty} className="gap-2">
                {saving ? <Save className="h-4 w-4 animate-pulse" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {saving ? t("saving") : dirty ? t("saveChanges") : t("saved")}
              </Button>
              <Button variant="outline" onClick={download} disabled={downloading} className="gap-2">
                <Download className="h-4 w-4" />
                {downloading ? t("downloading") : t("download")}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ── ATS skor paneli ──────────────────────────────────────────────── */
function AtsPanel({ ats }: { ats: ReturnType<typeof scoreCv> }) {
  const t = useTranslations("cv");
  const verdict = atsVerdict(ats.score);
  const color =
    verdict === "strong" ? "text-green-600 dark:text-green-400"
      : verdict === "average" ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const ring =
    verdict === "strong" ? "ring-green-500/30" : verdict === "average" ? "ring-amber-500/30" : "ring-red-500/30";
  return (
    <Card className={`shadow-sm ${ELEVATED}`}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4" />{t("atsTitle")}</CardTitle>
        <CardDescription>{t("atsHint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-5">
        <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted/50 ring-4 ${ring}`}>
          <span className={`text-3xl font-extrabold tabular-nums ${color}`}>{ats.score}</span>
          <span className="text-[11px] font-medium text-muted-foreground">{t(`verdict.${verdict}`)}</span>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{t("issuesTitle")}</p>
          {ats.issues.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"><Check className="h-4 w-4" />{t("noIssues")}</p>
          ) : (
            <ul className="space-y-1.5">
              {ats.issues.map((issue) => (
                <li key={issue.code} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-slate-400"
                  }`} />
                  {issue.code === "lowKeywordCoverage" ? t("issueLowKeywordCoverage") : t(`issue.${issue.code}`)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Editör ───────────────────────────────────────────────────────── */
function CvEditor({ content, patch }: { content: CvContent; patch: (n: Partial<CvContent>) => void }) {
  const t = useTranslations("cv");
  const c = content;

  // Dizi bölümü yardımcıları.
  function updateExp(i: number, next: Partial<CvExperience>) {
    patch({ experience: c.experience.map((e, idx) => (idx === i ? { ...e, ...next } : e)) });
  }
  function updateEdu(i: number, next: Partial<CvEducation>) {
    patch({ education: c.education.map((e, idx) => (idx === i ? { ...e, ...next } : e)) });
  }
  function updateProj(i: number, next: Partial<CvProject>) {
    patch({ projects: c.projects.map((p, idx) => (idx === i ? { ...p, ...next } : p)) });
  }
  function updateCert(i: number, next: Partial<CvCertification>) {
    patch({ certifications: c.certifications.map((x, idx) => (idx === i ? { ...x, ...next } : x)) });
  }
  function updateLang(i: number, next: Partial<CvLanguage>) {
    patch({ languages: c.languages.map((x, idx) => (idx === i ? { ...x, ...next } : x)) });
  }

  return (
    <div className="space-y-4">
      {/* İletişim + özet */}
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader><CardTitle className="text-base">{t("sectionContact")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fullName")} value={c.fullName} onChange={(v) => patch({ fullName: v })} />
          <Field label={t("jobTitle")} value={c.title} onChange={(v) => patch({ title: v })} />
          <Field label={t("email")} value={c.contact.email} onChange={(v) => patch({ contact: { ...c.contact, email: v } })} />
          <Field label={t("phone")} value={c.contact.phone} onChange={(v) => patch({ contact: { ...c.contact, phone: v } })} />
          <Field label={t("location")} value={c.contact.location} onChange={(v) => patch({ contact: { ...c.contact, location: v } })} />
          <Field label={t("linkedin")} value={c.contact.linkedin} onChange={(v) => patch({ contact: { ...c.contact, linkedin: v } })} />
          <Field label={t("website")} value={c.contact.website} onChange={(v) => patch({ contact: { ...c.contact, website: v } })} />
        </CardContent>
      </Card>

      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader><CardTitle className="text-base">{t("sectionSummary")}</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={c.summary} maxLength={2000} className="resize-none"
            onChange={(e) => patch({ summary: e.target.value })} />
        </CardContent>
      </Card>

      {/* Beceriler (virgülle ayrılmış) */}
      <Card className={`shadow-sm ${ELEVATED}`}>
        <CardHeader><CardTitle className="text-base">{t("sectionSkills")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("skillsHard")}</Label>
            <Input value={c.skills.hard.join(", ")}
              onChange={(e) => patch({ skills: { ...c.skills, hard: splitCsv(e.target.value) } })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("skillsSoft")}</Label>
            <Input value={c.skills.soft.join(", ")}
              onChange={(e) => patch({ skills: { ...c.skills, soft: splitCsv(e.target.value) } })} />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t("skillsHint")}</p>
        </CardContent>
      </Card>

      {/* Deneyim */}
      <SectionCard title={t("sectionExperience")} onAdd={() => patch({ experience: [...c.experience, { ...emptyExperience }] })} addLabel={t("addExperience")}>
        {c.experience.map((e, i) => (
          <ItemBlock key={i} onRemove={() => patch({ experience: c.experience.filter((_, idx) => idx !== i) })} removeLabel={t("removeExperience")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("role")} value={e.role} onChange={(v) => updateExp(i, { role: v })} />
              <Field label={t("company")} value={e.company} onChange={(v) => updateExp(i, { company: v })} />
              <Field label={t("location")} value={e.location} onChange={(v) => updateExp(i, { location: v })} />
              <div className="flex items-end gap-2">
                <Field label={t("startDate")} value={e.startDate} onChange={(v) => updateExp(i, { startDate: v })} className="flex-1" />
                <Field label={t("endDate")} value={e.endDate} onChange={(v) => updateExp(i, { endDate: v })} className="flex-1" disabled={e.current} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={e.current} onChange={(ev) => updateExp(i, { current: ev.target.checked })} />
                {t("current")}
              </label>
            </div>
            <BulletsEditor bullets={e.bullets} onChange={(b) => updateExp(i, { bullets: b })} />
          </ItemBlock>
        ))}
      </SectionCard>

      {/* Eğitim */}
      <SectionCard title={t("sectionEducation")} onAdd={() => patch({ education: [...c.education, { ...emptyEducation }] })} addLabel={t("addEducation")}>
        {c.education.map((e, i) => (
          <ItemBlock key={i} onRemove={() => patch({ education: c.education.filter((_, idx) => idx !== i) })} removeLabel={t("removeEducation")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("degree")} value={e.degree} onChange={(v) => updateEdu(i, { degree: v })} />
              <Field label={t("field")} value={e.field} onChange={(v) => updateEdu(i, { field: v })} />
              <Field label={t("school")} value={e.school} onChange={(v) => updateEdu(i, { school: v })} />
              <div className="flex items-end gap-2">
                <Field label={t("startDate")} value={e.startDate} onChange={(v) => updateEdu(i, { startDate: v })} className="flex-1" />
                <Field label={t("endDate")} value={e.endDate} onChange={(v) => updateEdu(i, { endDate: v })} className="flex-1" />
              </div>
            </div>
          </ItemBlock>
        ))}
      </SectionCard>

      {/* Projeler */}
      <SectionCard title={t("sectionProjects")} onAdd={() => patch({ projects: [...c.projects, { ...emptyProject }] })} addLabel={t("addProject")}>
        {c.projects.map((p, i) => (
          <ItemBlock key={i} onRemove={() => patch({ projects: c.projects.filter((_, idx) => idx !== i) })} removeLabel={t("removeProject")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("projName")} value={p.name} onChange={(v) => updateProj(i, { name: v })} />
              <Field label={t("projUrl")} value={p.url} onChange={(v) => updateProj(i, { url: v })} />
            </div>
            <div className="space-y-1.5 mt-3">
              <Label>{t("projDescription")}</Label>
              <Textarea rows={2} value={p.description} className="resize-none" onChange={(e) => updateProj(i, { description: e.target.value })} />
            </div>
            <BulletsEditor bullets={p.bullets} onChange={(b) => updateProj(i, { bullets: b })} />
          </ItemBlock>
        ))}
      </SectionCard>

      {/* Sertifikalar */}
      <SectionCard title={t("sectionCertifications")} onAdd={() => patch({ certifications: [...c.certifications, { ...emptyCert }] })} addLabel={t("addCertification")}>
        {c.certifications.map((x, i) => (
          <ItemBlock key={i} onRemove={() => patch({ certifications: c.certifications.filter((_, idx) => idx !== i) })} removeLabel={t("removeCertification")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t("certName")} value={x.name} onChange={(v) => updateCert(i, { name: v })} />
              <Field label={t("certIssuer")} value={x.issuer} onChange={(v) => updateCert(i, { issuer: v })} />
              <Field label={t("certDate")} value={x.date} onChange={(v) => updateCert(i, { date: v })} />
            </div>
          </ItemBlock>
        ))}
      </SectionCard>

      {/* Diller */}
      <SectionCard title={t("sectionLanguages")} onAdd={() => patch({ languages: [...c.languages, { ...emptyLang }] })} addLabel={t("addLanguage")}>
        {c.languages.map((x, i) => (
          <ItemBlock key={i} onRemove={() => patch({ languages: c.languages.filter((_, idx) => idx !== i) })} removeLabel={t("removeLanguage")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("langName")} value={x.name} onChange={(v) => updateLang(i, { name: v })} />
              <Field label={t("langLevel")} value={x.level} onChange={(v) => updateLang(i, { level: v })} />
            </div>
          </ItemBlock>
        ))}
      </SectionCard>
    </div>
  );
}

/* ── Küçük yardımcı bileşenler ────────────────────────────────────── */
function splitCsv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function Field({
  label, value, onChange, className = "", disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void; className?: string; disabled?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SectionCard({
  title, onAdd, addLabel, children,
}: {
  title: string; onAdd: () => void; addLabel: string; children: React.ReactNode;
}) {
  return (
    <Card className={`shadow-sm ${ELEVATED}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />{addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ItemBlock({
  onRemove, removeLabel, children,
}: {
  onRemove: () => void; removeLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-border p-4">
      <button type="button" onClick={onRemove} aria-label={removeLabel}
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer">
        <X className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}

function BulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  const t = useTranslations("cv");
  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <Label>{t("bullets")}</Label>
        <Button variant="ghost" size="sm" onClick={() => onChange([...bullets, ""])} className="gap-1 h-7">
          <Plus className="h-3.5 w-3.5" />{t("addBullet")}
        </Button>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={b} onChange={(e) => onChange(bullets.map((x, idx) => (idx === i ? e.target.value : x)))} />
          <button type="button" onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}
            aria-label={t("remove")} className="text-muted-foreground hover:text-destructive cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {bullets.length === 0 && <p className="text-xs text-muted-foreground">{t("bulletHint")}</p>}
    </div>
  );
}
