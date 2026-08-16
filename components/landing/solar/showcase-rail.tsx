"use client";

// Ürün vitrini: 6 adımlık ray + adım paneli. Otomatik ilerler, kullanıcı bir adıma
// tıklayınca durur (kontrol ondadır) ve oynat/duraklat butonuyla geri alınabilir.
// `prefers-reduced-motion` açıksa hiç ilerlemez, ilk adımda durur.
// NOT: Eski Remotion videosunun yerini alır — Solar Pop'ta hareket kısa ve yaylıdır,
// 24 saniyelik otomatik video bu ritme uymuyordu.
// Referans komp: docs/design/solar-pop/multifolio-landing-solar-pop.html (stagePanel)
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { Blob, Blobs } from "@/components/solar/primitives";
import { SectionHeading } from "@/components/solar/site-chrome";
import { useReducedMotion } from "@/components/solar/use-reduced-motion";

const STAGE_IDS = ["profile", "adapt", "feed", "proposal", "portfolio", "cv"] as const;
type StageId = (typeof STAGE_IDS)[number];

const STAGE_MS = 4200;

const JOBS = [
  { id: "a", score: 92, good: true },
  { id: "b", score: 88, good: true },
  { id: "c", score: 74, good: false },
  { id: "d", score: 61, good: false },
] as const;

const PLATFORMS = [
  { id: "linkedin", ink: "var(--flame-600)" },
  { id: "upwork", ink: "var(--pink-600)" },
  { id: "fiverr", ink: "var(--flame-600)" },
] as const;

export function ShowcaseRail() {
  const t = useTranslations("landing.sp.showcase");
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<number>(0);
  // Kullanıcı duraklattı mı — hareket tercihiyle birleşerek gerçek "playing"i verir.
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduced;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStage((s) => (s + 1) % STAGE_IDS.length), STAGE_MS);
    return () => clearInterval(id);
  }, [playing]);

  const current = STAGE_IDS[stage];

  return (
    <div className="sp-panel" style={{ background: "var(--surface-inverse)" }}>
      <Blobs>
        <Blob size={280} color="var(--flame-400)" shape="blob" style={{ right: -90, bottom: -90 }} />
        <Blob size={150} color="var(--flame-600)" shape="circle" opacity={0.55} style={{ left: -50, top: -50 }} />
      </Blobs>

      <div className="relative z-[2] grid gap-[26px]">
        <div className="flex flex-wrap items-end gap-5">
          <div className="mr-auto">
            <SectionHeading onDark eyebrow={t("eyebrow")} title={t("title")} script={t("script")} />
          </div>
          {!reduced ? (
            <button type="button" className="sp-btn sp-btn--sm sp-btn--quiet" onClick={() => setPaused((p) => !p)}>
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? t("pause") : t("play")}
            </button>
          ) : null}
        </div>

        {/* items-stretch: panel rayla aynı yüksekliği alsın, altta boşluk kalmasın */}
        <div className="sp-showcase grid gap-6">
          {/* Adım rayı */}
          <div className="grid gap-2">
            {STAGE_IDS.map((id, i) => {
              const on = stage === i;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={on ? "step" : undefined}
                  onClick={() => { setStage(i); setPaused(true); }}
                  className="grid w-full cursor-pointer items-start gap-[13px] rounded-[var(--radius-sp-md)] border-none px-[15px] py-[13px] text-left"
                  style={{
                    gridTemplateColumns: "38px 1fr",
                    background: on ? "var(--white)" : "rgba(255,255,255,.13)",
                    transition: "background var(--dur-base) var(--ease-out)",
                  }}
                >
                  <span
                    className="inline-grid h-[30px] w-[30px] place-items-center rounded-[var(--radius-pill)]"
                    style={{
                      background: on ? "var(--flame-500)" : "rgba(255,255,255,.22)",
                      color: "var(--white)", font: "var(--fw-black) 12px/1 var(--font-display)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid min-w-0 gap-[3px]">
                    <span
                      style={{
                        font: "var(--fw-black) var(--fs-body)/1.2 var(--font-display)",
                        textTransform: "uppercase", letterSpacing: ".02em",
                        color: on ? "var(--text-strong)" : "var(--white)",
                      }}
                    >
                      {t(`stages.${id}.title`)}
                    </span>
                    <span
                      style={{
                        font: "var(--fw-regular) var(--fs-body-s)/1.45 var(--font-body)",
                        color: on ? "var(--text-body)" : "rgba(255,255,255,.82)",
                      }}
                    >
                      {t(`stages.${id}.caption`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Adım paneli */}
          <div
            className="grid min-w-0 gap-4 rounded-[var(--radius-sp-lg)] p-5"
            style={{ background: "var(--white)", minHeight: 360, alignContent: "start" }}
          >
            <span className="sp-label sp-label--pink">{t(`panels.${current}.label`)}</span>
            <StagePanel id={current} t={t} />
            <p className="sp-body">{t(`panels.${current}.note`)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Adım panelleri (her biri gerçek ürün ekranının minyatürü) ─────── */
function StagePanel({ id, t }: { id: StageId; t: ReturnType<typeof useTranslations> }) {
  if (id === "profile") {
    return (
      <div className="grid gap-3.5">
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))" }}>
          {(["role", "years", "result", "rate"] as const).map((f) => (
            <div key={f} className="grid gap-[5px]">
              <span className="sp-label sp-label--muted">{t(`panels.profile.fields.${f}.label`)}</span>
              <span
                className="rounded-[var(--radius-sp-md)] px-[13px] py-[11px]"
                style={{ background: "var(--surface-page)", font: "var(--fw-medium) var(--fs-body)/1.4 var(--font-body)", color: "var(--text-strong)" }}
              >
                {t(`panels.profile.fields.${f}.value`)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["a", "b", "c", "d", "e"] as const).map((s) => (
            <span
              key={s}
              className="sp-label rounded-[var(--radius-pill)] px-[13px] py-[7px]"
              style={{ background: "var(--surface-card-alt)", color: "var(--pink-600)", letterSpacing: ".06em" }}
            >
              {t(`panels.profile.skills.${s}`)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (id === "adapt") {
    return (
      <div className="grid gap-3">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="grid items-center gap-3.5 rounded-[var(--radius-sp-md)] p-[15px]"
            style={{ gridTemplateColumns: "92px 1fr", background: "var(--surface-page)" }}
          >
            <span
              style={{
                font: "var(--fw-black) var(--fs-body-s)/1 var(--font-display)",
                textTransform: "uppercase", letterSpacing: ".05em", color: p.ink,
              }}
            >
              {t(`panels.adapt.platforms.${p.id}.name`)}
            </span>
            <span style={{ font: "var(--fw-medium) var(--fs-body)/1.55 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>
              {t(`panels.adapt.platforms.${p.id}.line`)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "feed") {
    return (
      <div className="grid gap-[9px]">
        {JOBS.map((j) => (
          <div
            key={j.id}
            className="grid items-center gap-3 rounded-[var(--radius-sp-md)] px-4 py-3.5"
            style={{ gridTemplateColumns: "1fr auto", background: "var(--surface-page)" }}
          >
            <span className="grid min-w-0 gap-[3px]">
              <span
                style={{
                  font: "var(--fw-black) var(--fs-body)/1.2 var(--font-display)",
                  textTransform: "uppercase", letterSpacing: ".02em", color: "var(--text-strong)",
                }}
              >
                {t(`panels.feed.jobs.${j.id}.role`)}
              </span>
              <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>
                {t(`panels.feed.jobs.${j.id}.meta`)}
              </span>
            </span>
            <span
              className="inline-flex items-center rounded-[var(--radius-pill)] px-[13px] py-[7px] tabular-nums"
              style={{
                background: j.good ? "var(--pink-200)" : "var(--amber-200)",
                color: j.good ? "var(--pink-600)" : "var(--flame-600)",
                font: "var(--fw-black) var(--fs-body)/1 var(--font-display)",
              }}
            >
              {j.score}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "proposal") {
    return (
      <div className="grid gap-3.5">
        <div className="rounded-[var(--radius-sp-md)] p-5" style={{ background: "var(--surface-page)", minHeight: 160 }}>
          <span className="sp-label sp-label--muted mb-3 block">{t("panels.proposal.re")}</span>
          <p style={{ font: "var(--fw-regular) var(--fs-body)/1.8 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>
            {t("panels.proposal.body")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="sp-label rounded-[var(--radius-pill)] px-[13px] py-[7px]"
            style={{ background: "var(--surface-card-alt)", color: "var(--pink-600)", letterSpacing: ".08em" }}
          >
            {t("panels.proposal.cost")}
          </span>
          <span className="sp-body sp-body--small" style={{ color: "var(--text-muted)" }}>{t("panels.proposal.editable")}</span>
        </div>
      </div>
    );
  }

  if (id === "portfolio") {
    return (
      <div className="overflow-hidden rounded-[var(--radius-sp-md)]" style={{ background: "var(--surface-page)" }}>
        <div className="flex items-center gap-[9px] px-3.5 py-[11px]">
          <span className="flex gap-[5px]">
            {["var(--flame-400)", "var(--amber-400)", "var(--pink-400)"].map((c) => (
              <span key={c} className="h-[9px] w-[9px] rounded-[var(--radius-pill)]" style={{ background: c }} />
            ))}
          </span>
          <span
            className="rounded-[var(--radius-pill)] px-3 py-[5px]"
            style={{ background: "var(--white)", font: "var(--fw-medium) var(--fs-label)/1 var(--font-body)", color: "var(--text-muted)" }}
          >
            {t("panels.portfolio.url")}
          </span>
        </div>
        <div className="grid gap-3.5 p-5" style={{ background: "var(--white)" }}>
          <span
            style={{
              font: "var(--fw-black) 22px/1.1 var(--font-display)",
              textTransform: "uppercase", letterSpacing: "var(--tracking-display)", color: "var(--text-strong)",
            }}
          >
            {t("panels.portfolio.headline")}
          </span>
          <span className="sp-body sp-body--small" style={{ maxWidth: "46ch" }}>{t("panels.portfolio.bio")}</span>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {(["a", "b", "c"] as const).map((k, i) => (
              <div
                key={k}
                className="grid gap-[7px] rounded-[var(--radius-sp-md)] p-3"
                style={{ background: ["var(--peach-100)", "var(--pink-100)", "var(--amber-200)"][i] }}
              >
                <span className="h-9 rounded-[var(--radius-sp-sm)]" style={{ background: "rgba(255,255,255,.62)" }} />
                <span className="sp-label" style={{ letterSpacing: ".06em", color: "var(--text-strong)" }}>
                  {t(`panels.portfolio.projects.${k}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // cv
  return (
    <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))" }}>
      <div className="grid gap-2 rounded-[var(--radius-sp-md)] p-4" style={{ background: "var(--surface-page)" }}>
        <span style={{ font: "var(--fw-black) var(--fs-body)/1 var(--font-display)", textTransform: "uppercase", color: "var(--text-strong)" }}>
          {t("panels.cv.name")}
        </span>
        <span style={{ font: "var(--fw-medium) var(--fs-label)/1 var(--font-body)", color: "var(--text-muted)" }}>
          {t("panels.cv.role")}
        </span>
        <div className="mt-1 grid gap-1.5" aria-hidden>
          {[90, 76, 84, 60, 70, 48].map((w, i) => (
            <span key={i} className="h-[5px] rounded-[3px]" style={{ width: `${w}%`, background: "var(--cream-400)" }} />
          ))}
        </div>
      </div>
      <div className="grid gap-[11px]">
        {([
          { k: "keywords", pct: 94, ink: "var(--pink-500)" },
          { k: "structure", pct: 100, ink: "var(--flame-500)" },
          { k: "length", pct: 82, ink: "var(--amber-400)" },
        ] as const).map((b) => (
          <div key={b.k} className="grid gap-1.5">
            <div className="flex justify-between gap-2.5" style={{ font: "var(--fw-bold) var(--fs-body-s)/1 var(--font-display)", textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-body)" }}>
              <span>{t(`panels.cv.bars.${b.k}`)}</span>
              <span style={{ color: "var(--text-strong)" }}>{b.pct}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--surface-muted)" }}>
              <div className="h-full rounded-[var(--radius-pill)]" style={{ width: `${b.pct}%`, background: b.ink }} />
            </div>
          </div>
        ))}
        <span
          className="sp-label w-fit rounded-[var(--radius-pill)] px-[13px] py-[7px]"
          style={{ background: "var(--flame-500)", color: "var(--white)", letterSpacing: ".08em" }}
        >
          {t("panels.cv.badge")}
        </span>
      </div>
    </div>
  );
}
