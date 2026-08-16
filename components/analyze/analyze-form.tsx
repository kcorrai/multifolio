"use client";

// Kayıtsız profil analizi — Solar Pop tasarımı. URL | metin → POST /api/analyze.
// GİZLİLİK/DÜRÜSTLÜK: kilitli bölüm blur hilesi DEĞİL — sunucu `full:null` döner,
// gerçek veri DOM'a hiç gelmez. Tasarım bunu açıkça söyler ("not blurred — not sent"),
// eski sürümdeki bulanık sahte içerik katmanı kaldırıldı.
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link2, ClipboardPaste, Sparkles, Package, Sun, ArrowRight } from "lucide-react";
import {
  Card, CardHead, ScoreBlock, Bar, Disc, ShareMark, TwoCol,
} from "@/components/solar/primitives";
import { TextField, TextAreaField } from "@/components/solar/fields";
import { ANALYSIS_KEYS, ANALYSIS_WEIGHTS, type AnalysisDimensionKey, type AnalysisVerdict } from "@/lib/analyze/score";

interface AnalyzeResponse {
  score: number;
  verdict: AnalysisVerdict;
  firstSuggestion: string | null;
  lockedSuggestions?: number;
  lockedNotes?: number;
  full: {
    dimensions: Record<AnalysisDimensionKey, { score: number; reason: string }>;
    suggestions: string[];
    upworkApprovalNotes: string[];
  } | null;
}

type View = "empty" | "computing" | "result" | "limited" | "error";

const barInk = (score: number) =>
  score >= 80 ? "var(--pink-500)" : score >= 60 ? "var(--amber-400)" : "var(--flame-500)";

export function AnalyzeForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("publicAnalysis");
  const ts = useTranslations("tools.shared");

  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [view, setView] = useState<View>("empty");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Sonuç mobilde fold altında beliriyor → geldiğinde oraya kaydır.
  useEffect(() => {
    if (view === "result") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const canSubmit = mode === "url" ? url.trim().length > 8 : text.trim().length >= 40;

  async function analyze() {
    setView("computing"); setError(""); setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url: url.trim() } : { text: text.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 429) { setView("limited"); return; }
      if (!res.ok) {
        setError(data?.error?.message ?? t("genericError"));
        setView("error");
        return;
      }
      setResult(data as AnalyzeResponse);
      setView("result");
    } catch {
      setError(t("genericError"));
      setView("error");
    }
  }

  /* ── Girdi ────────────────────────────────────────────────────────── */
  const inputs = (
    <Card>
      <div
        className="flex w-fit gap-[5px] rounded-[var(--radius-pill)] p-[5px]"
        style={{ background: "var(--surface-page)" }}
      >
        {(["url", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            className={`sp-chip ${mode === m ? "sp-chip--on" : ""}`}
          >
            {m === "url" ? <Link2 size={13} /> : <ClipboardPaste size={13} />}
            {t(`mode.${m}`)}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <TextField
          id="analyze-url"
          label={t("sp.urlLabel")}
          hint={t("urlHint")}
          value={url}
          onChange={setUrl}
          placeholder={t("urlPlaceholder")}
          error={view === "error" ? error : null}
        />
      ) : (
        <TextAreaField
          id="analyze-text"
          label={t("sp.textLabel")}
          hint={t("textHint")}
          rows={10}
          value={text}
          onChange={setText}
          countLabel={text.trim() ? ts("wordCount", { count: text.trim().split(/\s+/).length }) : ts("nothingPasted")}
          note={ts("staysInBrowser")}
        />
      )}

      {view === "error" && mode === "text" ? (
        <p role="alert" className="sp-body sp-body--small" style={{ color: "var(--pink-600)" }}>{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          className="sp-btn"
          disabled={!canSubmit || view === "computing"}
          onClick={analyze}
        >
          <Sparkles size={15} />
          {view === "computing" ? t("analyzing") : t("analyzeCta")}
        </button>
        <span className="sp-label" style={{ letterSpacing: ".06em" }}>{t("freeNote")}</span>
      </div>
    </Card>
  );

  /* ── Çıktı ────────────────────────────────────────────────────────── */
  let output;

  if (view === "computing") {
    output = (
      <Card>
        <div className="flex items-center gap-4">
          <span
            className="sp-spin h-[26px] w-[26px] rounded-[var(--radius-pill)]"
            style={{ border: "3px solid var(--cream-400)", borderTopColor: "var(--flame-500)" }}
          />
          <span className="grid gap-1">
            <span className="sp-sub">{t("sp.computingTitle")}</span>
            <span className="sp-body sp-body--small">{t("sp.computingBody")}</span>
          </span>
        </div>
        <div className="grid gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="sp-pulse h-12 rounded-[var(--radius-sp-md)]"
              style={{ background: "var(--surface-page)", animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        <p className="sp-body sp-body--small">{t("sp.skeletonNote")}</p>
      </Card>
    );
  } else if (view === "limited") {
    output = (
      <Card>
        <div className="grid gap-2.5 rounded-[var(--radius-sp-lg)] p-[22px]" style={{ background: "var(--amber-200)" }}>
          <span className="sp-title inline-flex items-center gap-2.5">
            <Sun size={18} />
            {t("sp.limitedTitle")}
          </span>
          <span className="sp-body">{t("sp.limitedBody")}</span>
        </div>
        <div className="grid gap-2.5">
          <span className="sp-sub">{t("sp.limitedAltTitle")}</span>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/headline-optimizer" className="sp-btn sp-btn--sm sp-btn--ghost">{t("sp.altHeadline")}</Link>
            <Link href="/ats-check" className="sp-btn sp-btn--sm sp-btn--ghost">{t("sp.altAts")}</Link>
            <Link href="/rate" className="sp-btn sp-btn--sm sp-btn--ghost">{t("sp.altRate")}</Link>
          </div>
        </div>
      </Card>
    );
  } else if (view === "result" && result) {
    const full = result.full;
    output = (
      <div ref={resultRef} className="grid gap-5 scroll-mt-5">
        <Card>
          <ScoreBlock
            value={result.score}
            words={[t("sp.words.strong"), t("sp.words.average"), t("sp.words.weak")]}
            scale={t("sp.scale")}
            scaleNote={ts("scaleNote")}
          />

          {result.firstSuggestion ? (
            <div className="grid gap-2.5">
              <h3 className="sp-sub">{t("sp.biggestIssue")}</h3>
              <p className="sp-body" style={{ lineHeight: 1.75 }}>{result.firstSuggestion}</p>
            </div>
          ) : null}

          <ShareMark href="/analyze" note={ts("shareMark")} />
        </Card>

        {full ? (
          <>
            <Card>
              <CardHead title={t("sp.dimensionsTitle")} />
              <div className="grid gap-3">
                {ANALYSIS_KEYS.map((key) => {
                  const dim = full.dimensions[key];
                  return (
                    <div key={key} className="grid gap-[7px]">
                      <Bar
                        label={`${t(`dimensions.${key}`)} · ${t("weight", { percent: Math.round(ANALYSIS_WEIGHTS[key] * 100) })}`}
                        pct={dim.score}
                        ink={barInk(dim.score)}
                      />
                      <span className="sp-body" style={{ fontSize: "var(--fs-label)", lineHeight: 1.5 }}>{dim.reason}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {full.suggestions.length > 0 ? (
              <Card>
                <CardHead title={t("allSuggestions")} />
                <div className="grid gap-2.5">
                  {full.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="grid gap-3 rounded-[var(--radius-sp-md)] px-4 py-[15px]"
                      style={{ gridTemplateColumns: "28px 1fr", background: "var(--surface-page)" }}
                    >
                      <span
                        className="inline-grid h-[26px] w-[26px] place-items-center rounded-[var(--radius-pill)]"
                        style={{ background: "var(--flame-500)", color: "var(--white)", font: "var(--fw-black) 12px/1 var(--font-display)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="sp-body">{s}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {full.upworkApprovalNotes.length > 0 ? (
              <Card tone="peach">
                <CardHead title={t("upworkNotes")} />
                <div className="grid gap-2">
                  {full.upworkApprovalNotes.map((s, i) => (
                    <span key={i} className="sp-body">{s}</span>
                  ))}
                </div>
              </Card>
            ) : null}
          </>
        ) : (
          /* Kilitli bölüm — sahte içerik YOK, yalnız boyut adları ve "— / 100". */
          <Card tone="pink">
            <div className="flex flex-wrap items-center gap-3">
              <span className="sp-title mr-auto inline-flex items-center gap-2.5">
                <Package size={17} />
                {t("sp.lockedTitle")}
              </span>
              <span
                className="sp-label rounded-[var(--radius-pill)] px-[13px] py-[7px] whitespace-nowrap"
                style={{ background: "var(--white)", color: "var(--flame-600)" }}
              >
                {t("sp.notBlurred")}
              </span>
            </div>

            <p className="sp-body">{t("sp.lockedBody")}</p>

            <div className="grid gap-2.5">
              {ANALYSIS_KEYS.map((key) => (
                <span
                  key={key}
                  className="flex items-center gap-3 rounded-[var(--radius-sp-md)] px-4 py-3.5"
                  style={{
                    background: "var(--white)",
                    font: "var(--fw-bold) var(--fs-body-s)/1 var(--font-display)",
                    textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-body)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-[var(--radius-pill)]"
                    style={{ border: "2px dashed var(--pink-400)" }}
                  />
                  {t(`dimensions.${key}`)}
                  <span className="ml-auto" style={{ font: "var(--fw-black) var(--fs-body-s)/1 var(--font-display)" }}>
                    {t("sp.lockedScore")}
                  </span>
                </span>
              ))}
            </div>

            <div className="grid gap-2.5">
              <Link href="/signup?ref=analyze" className="sp-btn sp-btn--lg sp-btn--block">
                {t("sp.lockedCta")}
                <ArrowRight size={16} />
              </Link>
              <span className="sp-label text-center" style={{ lineHeight: 1.4 }}>{t("sp.lockedPerk")}</span>
            </div>
          </Card>
        )}
      </div>
    );
  } else {
    output = (
      <Card>
        <CardHead title={t("sp.emptyTitle")} />
        <p className="sp-body">{t("sp.emptyBody")}</p>
        <div className="grid gap-2.5">
          {[
            { key: "free", bg: "var(--surface-card-alt)", ink: "var(--pink-600)", icon: Sparkles },
            { key: "account", bg: "var(--surface-page)", ink: "var(--text-muted)", icon: Package },
          ].map((row) => (
            <div
              key={row.key}
              className="grid gap-[13px] rounded-[var(--radius-sp-md)] p-[18px]"
              style={{ gridTemplateColumns: "34px 1fr", background: row.bg }}
            >
              <Disc icon={row.icon} size={34} bg="var(--white)" color={row.ink} glyph={15} />
              <span className="grid gap-1">
                <span className="sp-sub" style={{ fontSize: "var(--fs-body)" }}>{t(`sp.tier.${row.key}.title`)}</span>
                <span className="sp-body sp-body--small">{t(`sp.tier.${row.key}.body`)}</span>
              </span>
            </div>
          ))}
        </div>
        {isLoggedIn ? <p className="sp-body sp-body--small">{t("sp.loggedInNote")}</p> : null}
      </Card>
    );
  }

  return <TwoCol inputs={inputs} output={output} />;
}
