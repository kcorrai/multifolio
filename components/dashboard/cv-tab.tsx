"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles, Upload, Save, Check, AlertCircle, Download, Wand2, Plus, X, Gauge, Target,
  GripVertical, ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { CvPreview } from "./cv-preview";
import { scoreCv, atsVerdict, hasFillerPhrase } from "@/lib/cv/ats";
import { extractKeywordsFromText, matchKeywords } from "@/lib/cv/keywords";
import { arrayMove } from "@/lib/cv/reorder";
import { CV_TEMPLATES, CV_ACCENTS, CV_ACCENT_HEX, CV_SINGLE_COLUMN, isAtsSafe, type CvTemplate } from "@/lib/cv/theme";
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
  const [tailorMode, setTailorMode] = useState<"saved" | "paste">("saved");
  const [jobText, setJobText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ats = useMemo(() => (content ? scoreCv(content) : null), [content]);

  // ATS skor geçmişi (trend grafiği). CV varsa yükle + kayıt sonrası tazele. Tablo
  // yoksa (migration bekliyor) route boş döner → sessizce boş kalır.
  const [scoreHistory, setScoreHistory] = useState<{ score: number; created_at: string }[]>([]);
  const refreshHistory = useCallback(() => {
    fetch("/api/cv/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setScoreHistory(Array.isArray(b?.history) ? b.history : []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (initialCv.content) refreshHistory();
  }, [initialCv.content, refreshHistory]);

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
    refreshHistory(); // kayıt skoru değiştirmiş olabilir → trendi tazele
  }

  async function tailor(payload: { jobId: string } | { jobText: string }) {
    setTailoring(true); setError("");
    const res = await fetch("/api/cv/tailor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  // Bir deneyim/proje girdisinin maddelerini AI ile güçlendirir (2 kredi). Enhanced döner.
  async function enhanceBulletsApi(
    bullets: string[],
    ctx: { role: string; company: string },
  ): Promise<string[] | null> {
    setError("");
    const res = await fetch("/api/cv/bullets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullets, role: ctx.role, company: ctx.company }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("bulletsError"));
      if (res.status === 402) triggerComingSoon();
      return null;
    }
    if (body.credits) applyCredits(body.credits);
    setDirty(true);
    return body.bullets as string[];
  }

  // Güncel içerikten 2 özet varyantı üretir (1 kredi).
  async function generateSummaryApi(): Promise<string[] | null> {
    if (!content) return null;
    setError("");
    const res = await fetch("/api/cv/summary", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("summaryError"));
      if (res.status === 402) triggerComingSoon();
      return null;
    }
    if (body.credits) applyCredits(body.credits);
    return body.summaries as string[];
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
          {/* ── Tasarım (şablon + vurgu) + canlı önizleme ───────── */}
          <DesignAndPreview content={content} patch={patch} />

          <AtsPanel ats={ats!} history={scoreHistory} />

          {/* ── Anahtar kelime eşleşmesi (deterministik, kredisiz) ── */}
          <KeywordMatchCard content={content} patch={patch} />

          {/* ── İşe göre uyarla ──────────────────────────────────── */}
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4" />{t("tailorTitle")}</CardTitle>
              <CardDescription>{t("tailorHint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mod seçici: kayıtlı ilan / ilan metni yapıştır */}
              <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTailorMode("saved")}
                  className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                    tailorMode === "saved" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("tailorModeSaved")}
                </button>
                <button
                  type="button"
                  onClick={() => setTailorMode("paste")}
                  className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                    tailorMode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("tailorModePaste")}
                </button>
              </div>

              {tailorMode === "saved" ? (
                jobs.length === 0 ? (
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
                    <Button onClick={() => selectedJob && tailor({ jobId: selectedJob })} disabled={tailoring || !selectedJob} className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      {tailoring ? t("tailoring") : t("tailorCta")}
                      <CreditCost kind="cv_tailor" />
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <Textarea
                    rows={5}
                    value={jobText}
                    maxLength={12000}
                    placeholder={t("tailorPastePlaceholder")}
                    className="resize-none"
                    onChange={(e) => setJobText(e.target.value)}
                  />
                  <Button
                    onClick={() => jobText.trim().length >= 20 && tailor({ jobText: jobText.trim() })}
                    disabled={tailoring || jobText.trim().length < 20}
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    {tailoring ? t("tailoring") : t("tailorCta")}
                    <CreditCost kind="cv_tailor" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Editör ───────────────────────────────────────────── */}
          <CvEditor content={content} patch={patch} onEnhance={enhanceBulletsApi} onGenSummary={generateSummaryApi} />

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

/* ── Tasarım seçici + canlı önizleme ──────────────────────────────── */
function DesignAndPreview({ content, patch }: { content: CvContent; patch: (n: Partial<CvContent>) => void }) {
  const t = useTranslations("cv");
  return (
    <Card className={`shadow-sm ${ELEVATED}`}>
      <CardHeader>
        <CardTitle className="text-base">{t("designTitle")}</CardTitle>
        <CardDescription>{t("designHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Şablon kartları — tek-sütun ATS şablonları önce (yeşil ATS rozetli) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CV_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl}
              template={tpl}
              label={t(`template.${tpl}`)}
              accent={CV_ACCENT_HEX[content.theme.accent] ?? CV_ACCENT_HEX.blue}
              atsSafe={isAtsSafe(tpl)}
              atsSafeLabel={t("atsSafeBadge")}
              selected={content.theme.template === tpl}
              onSelect={() => patch({ theme: { ...content.theme, template: tpl } })}
            />
          ))}
        </div>
        {/* Görsel (çok-sütun) şablon → ATS uyarısı (araştırma: ayrıştırıcıyı bozar) */}
        {!isAtsSafe(content.theme.template) && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t("atsVisualWarning")}
          </div>
        )}
        {/* Vurgu rengi */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("accentLabel")}</span>
          <div className="flex gap-1.5">
            {CV_ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => patch({ theme: { ...content.theme, accent: a } })}
                aria-label={a}
                className={`h-6 w-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                  content.theme.accent === a ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/40" : ""
                }`}
                style={{ backgroundColor: CV_ACCENT_HEX[a] }}
              />
            ))}
          </div>
        </div>
        {/* Canlı önizleme */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 overflow-x-auto">
          <p className="mb-3 text-xs font-medium text-muted-foreground">{t("previewTitle")}</p>
          <CvPreview content={content} />
        </div>
      </CardContent>
    </Card>
  );
}

// Şablon seçim kartı: her şablonu temsil eden mini görsel + ad.
function TemplateCard({
  template, label, accent, selected, onSelect, atsSafe = false, atsSafeLabel = "",
}: {
  template: CvTemplate; label: string; accent: string; selected: boolean; onSelect: () => void;
  atsSafe?: boolean; atsSafeLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-xl border p-2 text-left transition-all cursor-pointer ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-border/80"
      }`}
    >
      {atsSafe && (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white shadow">
          {atsSafeLabel}
        </span>
      )}
      <div className="h-16 overflow-hidden rounded-lg border border-border bg-white">
        <TemplateThumb template={template} accent={accent} />
      </div>
      <span className="mt-1.5 block text-xs font-medium text-center">{label}</span>
    </button>
  );
}

// 4 şablonun mini temsili (PDF düzenini yansıtır).
function TemplateThumb({ template, accent }: { template: CvTemplate; accent: string }) {
  const line = (w: string, c = "#cbd5e1") => <span className="block h-1 rounded" style={{ width: w, backgroundColor: c }} />;
  if (template === "sidebar") {
    return (
      <div className="flex h-full">
        <div className="w-1/3 p-1.5 space-y-1" style={{ backgroundColor: accent }}>
          {line("80%", "rgba(255,255,255,0.7)")}{line("60%", "rgba(255,255,255,0.5)")}{line("70%", "rgba(255,255,255,0.5)")}
        </div>
        <div className="flex-1 p-1.5 space-y-1">{line("70%", accent)}{line("100%")}{line("90%")}{line("100%")}</div>
      </div>
    );
  }
  if (template === "banner") {
    return (
      <div className="h-full">
        <div className="p-1.5" style={{ backgroundColor: accent }}>{line("60%", "rgba(255,255,255,0.85)")}</div>
        <div className="flex gap-1 p-1.5">
          <div className="w-1/3 space-y-1">{line("100%")}{line("80%")}</div>
          <div className="flex-1 space-y-1">{line("90%", accent)}{line("100%")}{line("90%")}</div>
        </div>
      </div>
    );
  }
  if (template === "monogram") {
    return (
      <div className="flex h-full">
        <div className="flex-1 p-1.5 space-y-1">{line("70%", accent)}{line("100%")}{line("90%")}{line("100%")}</div>
        <div className="w-1/3 p-1.5 space-y-1" style={{ backgroundColor: `${accent}1a` }}>
          <span className="mx-auto block h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
          {line("80%")}{line("60%")}
        </div>
      </div>
    );
  }
  // Tek-sütun ATS şablonları (clean/classic/minimal/modern/compact) — stil config'ini yansıtır.
  const s = CV_SINGLE_COLUMN[template] ?? CV_SINGLE_COLUMN.clean;
  const headC = s.accentHeadings ? accent : "#94a3b8";
  const nameC = s.nameAccent ? accent : "#64748b";
  const alignCls = s.headerAlign === "center" ? "items-center" : "items-start";
  const heading = (w: string) =>
    s.headingDecoration === "leftbar" ? (
      <span className="flex w-full items-center gap-0.5">
        <span className="h-1 w-0.5 shrink-0 rounded" style={{ backgroundColor: accent }} />
        {line(w, headC)}
      </span>
    ) : (
      line(w, headC)
    );
  return (
    <div className={`flex h-full flex-col gap-1 p-2 ${alignCls}`}>
      {line("50%", nameC)}{line("32%")}
      {heading("42%")}
      {line("100%")}{line("90%")}
      {heading("38%")}
      {line("100%")}
    </div>
  );
}

/* ── Bölüm çapasına yumuşak kaydırma (ATS bulgusuna tıkla → ilgili bölüm) ── */
const ISSUE_ANCHOR: Record<string, string> = {
  noName: "cv-section-contact",
  noEmail: "cv-section-contact",
  noPhone: "cv-section-contact",
  noSummary: "cv-section-summary",
  noSkills: "cv-section-skills",
  noExperience: "cv-section-experience",
  fewQuantified: "cv-section-experience",
  fillerPhrases: "cv-section-experience",
  inconsistentDates: "cv-section-experience",
  lowKeywordCoverage: "cv-section-keywords",
};
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── ATS skor paneli ──────────────────────────────────────────────── */
// ATS skor trendi mini grafiği (SAF SVG, ek bağımlılık yok). Kayıtlı anlık görüntüler.
function ScoreSparkline({ points }: { points: number[] }) {
  const w = 120, h = 32, pad = 3;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points
    .map((p, i) => `${(pad + i * step).toFixed(1)},${(pad + (h - pad * 2) * (1 - (p - min) / range)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AtsPanel({ ats, history }: { ats: ReturnType<typeof scoreCv>; history: { score: number; created_at: string }[] }) {
  const t = useTranslations("cv");
  const verdict = atsVerdict(ats.score);
  const trend = history.length >= 2 ? { delta: history[history.length - 1].score - history[0].score } : null;
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
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl bg-muted/50 ring-4 ${ring}`}>
            <span className={`text-3xl font-extrabold tabular-nums ${color}`}>{ats.score}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{t(`verdict.${verdict}`)}</span>
          </div>
          {trend && (
            <div className="flex flex-col items-center gap-0.5">
              <div className={color}><ScoreSparkline points={history.map((h) => h.score)} /></div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {trend.delta >= 0 ? `+${trend.delta}` : trend.delta} · {t("trend30d")}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{t("issuesTitle")}</p>
          {ats.issues.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"><Check className="h-4 w-4" />{t("noIssues")}</p>
          ) : (
            <ul className="space-y-1.5">
              {ats.issues.map((issue) => (
                <li key={issue.code}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(ISSUE_ANCHOR[issue.code] ?? "")}
                    title={t("jumpToSection")}
                    className="flex w-full items-start gap-2 text-left text-sm text-muted-foreground rounded-md px-1 -mx-1 py-0.5 hover:bg-muted/60 hover:text-foreground cursor-pointer transition-colors"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-slate-400"
                    }`} />
                    {issue.code === "lowKeywordCoverage" ? t("issueLowKeywordCoverage") : t(`issue.${issue.code}`)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Anahtar kelime eşleşme kartı (deterministik, kredisiz) ─────────── */
// Beceri anahtar kelimesini gösterim için düzgün büyük/küçük harfe getirir
// (kısa harf grupları kısaltma sayılır: aws→AWS, seo→SEO; react→React).
function prettySkill(k: string): string {
  return k
    .split(" ")
    .map((w) => (w.length <= 3 && /^[a-z]+$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function KeywordMatchCard({ content, patch }: { content: CvContent; patch: (n: Partial<CvContent>) => void }) {
  const t = useTranslations("cv");
  const [jd, setJd] = useState("");
  const [keywords, setKeywords] = useState<string[] | null>(null);

  const result = useMemo(
    () => (keywords ? matchKeywords(content, keywords) : null),
    [keywords, content],
  );

  function analyze() {
    setKeywords(extractKeywordsFromText(jd));
  }

  function addSkill(kw: string) {
    const pretty = prettySkill(kw);
    const exists = content.skills.hard.some((s) => s.toLowerCase() === pretty.toLowerCase());
    if (!exists) patch({ skills: { ...content.skills, hard: [...content.skills.hard, pretty] } });
  }

  return (
    <Card id="cv-section-keywords" className={`shadow-sm ${ELEVATED} scroll-mt-20`}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />{t("keywordTitle")}</CardTitle>
        <CardDescription>{t("keywordHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={4}
          value={jd}
          maxLength={12000}
          placeholder={t("keywordPlaceholder")}
          className="resize-none"
          onChange={(e) => setJd(e.target.value)}
        />
        <Button onClick={analyze} disabled={!jd.trim()} variant="outline" size="sm" className="gap-2">
          <Target className="h-4 w-4" />{t("keywordAnalyze")}
        </Button>

        {result && keywords && keywords.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("keywordNone")}</p>
        )}

        {result && keywords && keywords.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            {/* Kapsam yüzdesi */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">{t("keywordCoverageLabel")}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.coveragePct >= 60 ? "bg-green-500" : result.coveragePct >= 30 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${result.coveragePct}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">{result.coveragePct}%</span>
            </div>

            {/* Eksik anahtar kelimeler (tıkla → becerilere ekle) */}
            {result.missing.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("keywordMissingLabel", { count: result.missing.length })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addSkill(k)}
                      title={t("keywordAddSkill")}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" />{prettySkill(k)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Karşılanan anahtar kelimeler */}
            {result.matched.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-green-600 dark:text-green-400">
                  {t("keywordMatchedLabel", { count: result.matched.length })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full border border-green-300 dark:border-green-800/60 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 text-xs text-green-700 dark:text-green-300"
                    >
                      <Check className="h-3 w-3" />{prettySkill(k)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.missing.length === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" />{t("keywordAllCovered")}
              </p>
            )}

            <p className="text-xs text-muted-foreground">{t("keywordApprox")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Editör ───────────────────────────────────────────────────────── */
type EnhanceFn = (bullets: string[], ctx: { role: string; company: string }) => Promise<string[] | null>;

function CvEditor({
  content, patch, onEnhance, onGenSummary,
}: {
  content: CvContent;
  patch: (n: Partial<CvContent>) => void;
  onEnhance: EnhanceFn;
  onGenSummary: () => Promise<string[] | null>;
}) {
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
      <Card id="cv-section-contact" className={`shadow-sm ${ELEVATED} scroll-mt-20`}>
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

      <Card id="cv-section-summary" className={`shadow-sm ${ELEVATED} scroll-mt-20`}>
        <CardHeader><CardTitle className="text-base">{t("sectionSummary")}</CardTitle></CardHeader>
        <CardContent>
          <SummaryEditor summary={c.summary} onChange={(v) => patch({ summary: v })} onGenerate={onGenSummary} />
        </CardContent>
      </Card>

      {/* Beceriler (virgülle ayrılmış) */}
      <Card id="cv-section-skills" className={`shadow-sm ${ELEVATED} scroll-mt-20`}>
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
      <SectionCard id="cv-section-experience" title={t("sectionExperience")} onAdd={() => patch({ experience: [...c.experience, { ...emptyExperience }] })} addLabel={t("addExperience")}>
        <SortableSection
          items={c.experience}
          onReorder={(from, to) => patch({ experience: arrayMove(c.experience, from, to) })}
          onRemove={(i) => patch({ experience: c.experience.filter((_, idx) => idx !== i) })}
          removeLabel={t("removeExperience")}
          renderItem={(e, i) => (
            <>
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
              <BulletsEditor
                bullets={e.bullets}
                onChange={(b) => updateExp(i, { bullets: b })}
                onEnhance={onEnhance}
                enhanceCtx={{ role: e.role, company: e.company }}
              />
            </>
          )}
        />
      </SectionCard>

      {/* Eğitim */}
      <SectionCard title={t("sectionEducation")} onAdd={() => patch({ education: [...c.education, { ...emptyEducation }] })} addLabel={t("addEducation")}>
        <SortableSection
          items={c.education}
          onReorder={(from, to) => patch({ education: arrayMove(c.education, from, to) })}
          onRemove={(i) => patch({ education: c.education.filter((_, idx) => idx !== i) })}
          removeLabel={t("removeEducation")}
          renderItem={(e, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("degree")} value={e.degree} onChange={(v) => updateEdu(i, { degree: v })} />
              <Field label={t("field")} value={e.field} onChange={(v) => updateEdu(i, { field: v })} />
              <Field label={t("school")} value={e.school} onChange={(v) => updateEdu(i, { school: v })} />
              <div className="flex items-end gap-2">
                <Field label={t("startDate")} value={e.startDate} onChange={(v) => updateEdu(i, { startDate: v })} className="flex-1" />
                <Field label={t("endDate")} value={e.endDate} onChange={(v) => updateEdu(i, { endDate: v })} className="flex-1" />
              </div>
            </div>
          )}
        />
      </SectionCard>

      {/* Projeler */}
      <SectionCard title={t("sectionProjects")} onAdd={() => patch({ projects: [...c.projects, { ...emptyProject }] })} addLabel={t("addProject")}>
        <SortableSection
          items={c.projects}
          onReorder={(from, to) => patch({ projects: arrayMove(c.projects, from, to) })}
          onRemove={(i) => patch({ projects: c.projects.filter((_, idx) => idx !== i) })}
          removeLabel={t("removeProject")}
          renderItem={(p, i) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("projName")} value={p.name} onChange={(v) => updateProj(i, { name: v })} />
                <Field label={t("projUrl")} value={p.url} onChange={(v) => updateProj(i, { url: v })} />
              </div>
              <div className="space-y-1.5 mt-3">
                <Label>{t("projDescription")}</Label>
                <Textarea rows={2} value={p.description} className="resize-none" onChange={(e) => updateProj(i, { description: e.target.value })} />
              </div>
              <BulletsEditor
                bullets={p.bullets}
                onChange={(b) => updateProj(i, { bullets: b })}
                onEnhance={onEnhance}
                enhanceCtx={{ role: p.name, company: "" }}
              />
            </>
          )}
        />
      </SectionCard>

      {/* Sertifikalar */}
      <SectionCard title={t("sectionCertifications")} onAdd={() => patch({ certifications: [...c.certifications, { ...emptyCert }] })} addLabel={t("addCertification")}>
        <SortableSection
          items={c.certifications}
          onReorder={(from, to) => patch({ certifications: arrayMove(c.certifications, from, to) })}
          onRemove={(i) => patch({ certifications: c.certifications.filter((_, idx) => idx !== i) })}
          removeLabel={t("removeCertification")}
          renderItem={(x, i) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t("certName")} value={x.name} onChange={(v) => updateCert(i, { name: v })} />
              <Field label={t("certIssuer")} value={x.issuer} onChange={(v) => updateCert(i, { issuer: v })} />
              <Field label={t("certDate")} value={x.date} onChange={(v) => updateCert(i, { date: v })} />
            </div>
          )}
        />
      </SectionCard>

      {/* Diller */}
      <SectionCard title={t("sectionLanguages")} onAdd={() => patch({ languages: [...c.languages, { ...emptyLang }] })} addLabel={t("addLanguage")}>
        <SortableSection
          items={c.languages}
          onReorder={(from, to) => patch({ languages: arrayMove(c.languages, from, to) })}
          onRemove={(i) => patch({ languages: c.languages.filter((_, idx) => idx !== i) })}
          removeLabel={t("removeLanguage")}
          renderItem={(x, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("langName")} value={x.name} onChange={(v) => updateLang(i, { name: v })} />
              <Field label={t("langLevel")} value={x.level} onChange={(v) => updateLang(i, { level: v })} />
            </div>
          )}
        />
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
  title, onAdd, addLabel, children, id,
}: {
  title: string; onAdd: () => void; addLabel: string; children: React.ReactNode; id?: string;
}) {
  return (
    <Card id={id} className={`shadow-sm ${ELEVATED} scroll-mt-20`}>
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

// Sıralanabilir bölüm: her girdi sürükle-bırak (masaüstü) + yukarı/aşağı buton
// (erişilebilir/mobil) ile yeniden sıralanır. Dizi sırası = render sırası.
function SortableSection<T>({
  items, onReorder, onRemove, removeLabel, renderItem,
}: {
  items: T[];
  onReorder: (from: number, to: number) => void;
  onRemove: (i: number) => void;
  removeLabel: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const t = useTranslations("cv");
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const many = items.length > 1;
  const ctrl =
    "h-6 w-6 rounded-full bg-background border border-border shadow flex items-center justify-center text-muted-foreground cursor-pointer";

  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          onDragOver={many ? (e) => { e.preventDefault(); if (over !== i) setOver(i); } : undefined}
          onDrop={many ? (e) => { e.preventDefault(); if (drag !== null && drag !== i) onReorder(drag, i); setDrag(null); setOver(null); } : undefined}
          className={`relative rounded-xl border p-4 pt-7 transition-colors ${
            over === i && drag !== null && drag !== i ? "border-primary ring-2 ring-primary/30" : "border-border"
          } ${drag === i ? "opacity-40" : ""}`}
        >
          <div className="absolute -top-2.5 right-3 flex items-center gap-1">
            {many && (
              <>
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDrag(i)}
                  onDragEnd={() => { setDrag(null); setOver(null); }}
                  aria-label={t("reorderDrag")}
                  title={t("reorderDrag")}
                  className={`${ctrl} hover:text-foreground cursor-grab active:cursor-grabbing`}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => i > 0 && onReorder(i, i - 1)} disabled={i === 0}
                  aria-label={t("reorderUp")} className={`${ctrl} hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed`}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => i < items.length - 1 && onReorder(i, i + 1)} disabled={i === items.length - 1}
                  aria-label={t("reorderDown")} className={`${ctrl} hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed`}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button type="button" onClick={() => onRemove(i)} aria-label={removeLabel} className={`${ctrl} hover:text-destructive`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
    </>
  );
}

// Özet: düz metin + "AI ile yaz" (1 kredi) → 2 varyant → tıkla-uygula.
function SummaryEditor({
  summary, onChange, onGenerate,
}: {
  summary: string;
  onChange: (v: string) => void;
  onGenerate: () => Promise<string[] | null>;
}) {
  const t = useTranslations("cv");
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const wordsOk = words >= 50 && words <= 100;

  async function generate() {
    setBusy(true);
    const res = await onGenerate();
    setBusy(false);
    if (res) setVariants(res);
  }

  return (
    <div className="space-y-3">
      <Textarea rows={4} value={summary} maxLength={2000} className="resize-none"
        onChange={(e) => onChange(e.target.value)} />
      <p className={`text-xs ${wordsOk ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
        {t("summaryWords", { count: words })}
      </p>
      <Button variant="outline" size="sm" onClick={generate} disabled={busy} className="gap-2">
        <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
        {busy ? t("summaryGenerating") : t("summaryGenerate")}
        <CreditCost kind="cv_summary" />
      </Button>
      {variants && variants.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">{t("summaryPick")}</p>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(v); setVariants(null); }}
              className="block w-full rounded-lg border border-border p-3 text-left text-sm hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BulletsEditor({
  bullets, onChange, onEnhance, enhanceCtx,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  onEnhance?: EnhanceFn;
  enhanceCtx?: { role: string; company: string };
}) {
  const t = useTranslations("cv");
  const [busy, setBusy] = useState(false);
  const canEnhance = !!onEnhance && !!enhanceCtx && bullets.some((b) => b.trim());

  async function enhance() {
    if (!onEnhance || !enhanceCtx) return;
    const nonEmpty = bullets.filter((b) => b.trim());
    if (nonEmpty.length === 0) return;
    setBusy(true);
    const res = await onEnhance(nonEmpty, enhanceCtx);
    setBusy(false);
    if (res) onChange(res);
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{t("bullets")}</Label>
        <div className="flex items-center gap-1">
          {canEnhance && (
            <Button variant="ghost" size="sm" onClick={enhance} disabled={busy} className="gap-1 h-7 text-primary">
              <Wand2 className={`h-3.5 w-3.5 ${busy ? "animate-pulse" : ""}`} />
              {busy ? t("bulletsEnhancing") : t("bulletsEnhance")}
              <CreditCost kind="cv_bullets" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onChange([...bullets, ""])} className="gap-1 h-7">
            <Plus className="h-3.5 w-3.5" />{t("addBullet")}
          </Button>
        </div>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Input value={b} onChange={(e) => onChange(bullets.map((x, idx) => (idx === i ? e.target.value : x)))} />
            {bullets.length > 1 && (
              <>
                <button type="button" onClick={() => onChange(arrayMove(bullets, i, i - 1))} disabled={i === 0}
                  aria-label={t("reorderUp")} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => onChange(arrayMove(bullets, i, i + 1))} disabled={i === bullets.length - 1}
                  aria-label={t("reorderDown")} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button type="button" onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}
              aria-label={t("remove")} className="text-muted-foreground hover:text-destructive cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          {hasFillerPhrase(b) && (
            <p className="flex items-center gap-1 pl-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3 shrink-0" />{t("weakPhrase")}
            </p>
          )}
          {b.trim().length > 220 && (
            <p className="flex items-center gap-1 pl-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3 shrink-0" />{t("bulletTooLong")}
            </p>
          )}
        </div>
      ))}
      {bullets.length === 0 && <p className="text-xs text-muted-foreground">{t("bulletHint")}</p>}
    </div>
  );
}
