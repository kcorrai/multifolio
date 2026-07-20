/**
 * Landing "See it in action" anlatı videosu — tek Remotion kompozisyonu.
 *
 * Multifolio'nun akışını 24 saniyede gösterir: profili bir kez gir → skorlu iş feed'i →
 * AI teklif (auto-submit YOK) → yayınlanan portfolyo → ATS-uyumlu CV. Tarayıcıda
 * @remotion/player ile canlı oynar (MP4 yok); aynı bileşen Remotion CLI ile MP4'e de
 * export edilebilir (bkz. Root.tsx).
 *
 * Metin DIŞARIDAN `copy` prop'uyla gelir: kullanıcıya görünen tüm string i18n
 * katalogunda kalır (CLAUDE.md sert kural), kompozisyon next-intl bağlamına muhtaç olmaz.
 * Renkler `palette` prop'uyla gelir → sayfa açık/koyu temasına uyar.
 */
import { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, PALETTES, PLATFORM_TONES, VIDEO, type Palette } from "./theme";
import { SCENES, activeScene, activeSceneIndex, sceneWindow, type SceneId } from "./scenes";

/* ── Kompakt (mobil) mod ───────────────────────────────────────────────
   Tuval 1280×720 SABİT (Remotion kompozisyonu ölçeklenerek sığar). 390px'lik
   bir telefonda bu ~307px'e iner → 28px başlık ~7px görünür, okunmaz.
   Çözüm: kompakt modda içerik DAHA KÜÇÜK bir mantıksal tuvale (1280/ZOOM)
   çizilir ve CSS ile ZOOM katı büyütülür → aynı 1280×720'yi doldurur ama her
   şey ZOOM kat iri görünür. Ayrıca sol adım rayı gizlenir ve tekrarlanan
   öğeler (iş satırı/proje/şablon) kırpılır — dar alanda sıkışmasınlar. */
const COMPACT_ZOOM = 1.45;

const CompactContext = createContext(false);
const useCompact = () => useContext(CompactContext);

/** Kompakt modda listeyi kırpar (dar mantıksal tuvale sığsın). */
function trim<T>(items: T[], compact: boolean, keep: number): T[] {
  return compact ? items.slice(0, keep) : items;
}

/* ── Dışarıdan gelen metin sözleşmesi ──────────────────────────────── */

export interface ShowcaseJob {
  title: string;
  platform: string;
  score: number;
  budget: string;
}

export interface ShowcaseCopy {
  /** Sol raydaki adım etiketleri. */
  steps: Record<SceneId, string>;
  /** Her sahnenin üst başlığı (asıl mesaj). */
  headline: Record<SceneId, string>;
  profile: { headline: string; skills: string[] };
  feed: { jobs: ShowcaseJob[]; scoreLabel: string };
  proposal: { text: string; autoPilot: string; on: string; noAutoSubmit: string };
  portfolio: { name: string; role: string; hire: string; projects: string[] };
  cv: { role: string; download: string; atsLabel: string; templates: string[] };
}

/* ── Ortak yardımcılar ─────────────────────────────────────────────── */

/** Sahnenin fade + yükselme stili (giriş/çıkış pencereleri scenes.ts'ten). */
function useSceneStyle(sceneIndex: number): React.CSSProperties {
  const frame = useCurrentFrame();
  const [es, ee, xs, xe] = sceneWindow(SCENES[sceneIndex]!);
  const opacity = interpolate(frame, [es, ee, xs, xe], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [es, ee], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    opacity,
    transform: `translateY(${y}px)`,
    position: "absolute",
    inset: 0,
    padding: "26px 30px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };
}

/** delay karesinden sonra 0→1 yaylanan giriş değeri. */
function useEnter(delay: number, damping = 15): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 120 }, durationInFrames: 26 });
}

function Card({
  p,
  style,
  children,
}: {
  p: Palette;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: p.card,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ p, label, tone }: { p: Palette; label: string; tone?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 11px",
        borderRadius: 999,
        fontSize: 15,
        fontWeight: 600,
        color: tone ?? p.textMuted,
        background: tone ? p.accentSoft : "transparent",
        border: `1px solid ${tone ? "transparent" : p.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/** Sahne üst başlığı — asıl satış mesajı. */
function Headline({ p, text, delay = 0 }: { p: Palette; text: string; delay?: number }) {
  const e = useEnter(delay);
  const compact = useCompact();
  return (
    <h2
      style={{
        margin: 0,
        fontSize: compact ? 32 : 28,
        lineHeight: 1.2,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: p.text,
        opacity: e,
        transform: `translateY(${(1 - e) * 10}px)`,
      }}
    >
      {text}
    </h2>
  );
}

/* ── Sahne 1: Profil ───────────────────────────────────────────────── */

function ProfileScene({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const style = useSceneStyle(0);
  const avatar = useEnter(8, 12);
  const name = useEnter(16);
  return (
    <div style={style}>
      <Headline p={p} text={copy.headline.profile} delay={2} />
      {/* alignItems:center → içerik uzun kartta dikeyde ortalanır (üstte toplanıp altta boşluk bırakmaz). */}
      <Card p={p} style={{ flex: 1, padding: 26, display: "flex", gap: 22, alignItems: "center" }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            flexShrink: 0,
            background: `linear-gradient(150deg, ${p.accent}, ${p.accentSoft})`,
            transform: `scale(${0.7 + avatar * 0.3})`,
            opacity: avatar,
            boxShadow: `0 0 0 4px ${p.accentSoft}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: p.text,
              opacity: name,
            }}
          >
            {copy.profile.headline}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 }}>
            {copy.profile.skills.map((s, i) => (
              <SkillChip key={s} p={p} label={s} delay={24 + i * 6} accent={i % 3 === 0} />
            ))}
          </div>
          {/* Profil tamamlanma çubuğu — "bir kez gir" mesajının görsel kapanışı. */}
          <ProgressBar p={p} delay={54} />
        </div>
      </Card>
    </div>
  );
}

/* Hook'lar map callback'inde çağrılamaz (rules-of-hooks) → her tekrarlanan öğe kendi bileşeni. */
function SkillChip({ p, label, delay, accent }: { p: Palette; label: string; delay: number; accent: boolean }) {
  const e = useEnter(delay);
  return (
    <div style={{ opacity: e, transform: `translateY(${(1 - e) * 8}px)` }}>
      <Chip p={p} label={label} tone={accent ? p.accentText : undefined} />
    </div>
  );
}

function ProgressBar({ p, delay }: { p: Palette; delay: number }) {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [delay, delay + 34], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ marginTop: 26, maxWidth: 420 }}>
      <div style={{ height: 8, borderRadius: 999, background: p.raised, overflow: "hidden", border: `1px solid ${p.border}` }}>
        <div style={{ width: `${w}%`, height: "100%", background: p.accent, borderRadius: 999 }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: p.accentText, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(w)}%
      </div>
    </div>
  );
}

/* ── Sahne 2: Feed ─────────────────────────────────────────────────── */

function FeedScene({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const style = useSceneStyle(1);
  const compact = useCompact();
  const base = SCENES[1]!.start;
  return (
    <div style={style}>
      <Headline p={p} text={copy.headline.feed} delay={base + 2} />
      {/* Satırlar dikeyde ortalanır — 4 satır kareyi doldurmadığı için alt boşluk oluşmasın. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, justifyContent: "center" }}>
        {trim(copy.feed.jobs, compact, 3).map((job, i) => (
          <JobRow key={job.title} p={p} job={job} delay={base + 14 + i * 12} scoreLabel={copy.feed.scoreLabel} showUnread={i < 2} />
        ))}
      </div>
    </div>
  );
}

function JobRow({
  p,
  job,
  delay,
  scoreLabel,
  showUnread,
}: {
  p: Palette;
  job: ShowcaseJob;
  delay: number;
  scoreLabel: string;
  showUnread: boolean;
}) {
  const frame = useCurrentFrame();
  const e = useEnter(delay);
  const compact = useCompact();
  // Skor 0'dan hedefe sayar (landing CountUp'ın video karşılığı).
  const score = Math.round(
    interpolate(frame, [delay + 8, delay + 30], [0, job.score], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const tone = score >= 85 ? p.success : score >= 70 ? p.accentText : p.warning;
  return (
    <Card
      p={p}
      style={{
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: e,
        transform: `translateX(${(1 - e) * -26}px)`,
      }}
    >
      {showUnread && <span style={{ width: 8, height: 8, borderRadius: 999, background: p.accent, flexShrink: 0 }} />}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: 6,
          color: "#fff",
          background: PLATFORM_TONES[job.platform] ?? p.textSubtle,
          flexShrink: 0,
        }}
      >
        {job.platform}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: p.text, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {job.title}
      </span>
      {/* Bütçe kompakt modda gizlenir — dar satırda başlık ile skora yer açar. */}
      {!compact && <span style={{ fontSize: 15, fontWeight: 600, color: p.textMuted, flexShrink: 0 }}>{job.budget}</span>}
      <span style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0, width: 78, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: tone, fontVariantNumeric: "tabular-nums" }}>{score}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.textSubtle }}>
          {scoreLabel}
        </span>
      </span>
    </Card>
  );
}

/* ── Sahne 3: Teklif + Auto-Pilot ──────────────────────────────────── */

function ProposalScene({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const style = useSceneStyle(2);
  const frame = useCurrentFrame();
  const base = SCENES[2]!.start;
  // Daktilo: metin karakter karakter yazılır.
  const chars = Math.round(
    interpolate(frame, [base + 20, base + 105], [0, copy.proposal.text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const badge = useEnter(base + 96, 11);
  return (
    <div style={style}>
      <Headline p={p} text={copy.headline.proposal} delay={base + 2} />
      <Card p={p} style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Metin kartta dikeyde ortalanır ve iri punto — tek satır dev boşlukta kaybolmasın. */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 27, lineHeight: 1.6, fontWeight: 500, color: p.text, maxWidth: "92%" }}>
            {copy.proposal.text.slice(0, chars)}
            <span style={{ color: p.accent, fontWeight: 800, opacity: caretOn ? 1 : 0 }}>▍</span>
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: badge,
            transform: `translateY(${(1 - badge) * 12}px)`,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: p.accentSoft,
              border: `1px solid ${p.accent}`,
              fontSize: 15,
              fontWeight: 700,
              color: p.accentText,
            }}
          >
            {copy.proposal.autoPilot}
            <span style={{ padding: "2px 8px", borderRadius: 999, background: p.accent, color: "#04121a", fontSize: 12, fontWeight: 800 }}>
              {copy.proposal.on}
            </span>
          </span>
          {/* Ürün ilkesi: asla otomatik gönderim yok — videoda da açıkça yazar. */}
          <span style={{ fontSize: 15, fontWeight: 700, color: p.success }}>✓ {copy.proposal.noAutoSubmit}</span>
        </div>
      </Card>
    </div>
  );
}

/* ── Sahne 4: Portfolyo ────────────────────────────────────────────── */

function PortfolioScene({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const style = useSceneStyle(3);
  const compact = useCompact();
  const frame = useCurrentFrame();
  const base = SCENES[3]!.start;
  const hero = useEnter(base + 10, 13);
  // "Hire me" nabzı — dikkati CTA'ya çeker.
  const pulse = 1 + Math.sin(Math.max(0, frame - base - 70) / 7) * 0.035;
  return (
    <div style={style}>
      <Headline p={p} text={copy.headline.portfolio} delay={base + 2} />
      <Card p={p} style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: hero, transform: `translateY(${(1 - hero) * 14}px)` }}>
          <div style={{ width: 66, height: 66, borderRadius: 999, background: `linear-gradient(150deg, ${p.accent}, ${p.accentSoft})`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: p.text }}>{copy.portfolio.name}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: p.textMuted, marginTop: 3 }}>{copy.portfolio.role}</div>
          </div>
          <span
            style={{
              padding: "11px 22px",
              borderRadius: 12,
              background: p.accent,
              color: "#04121a",
              fontSize: 16,
              fontWeight: 800,
              transform: `scale(${pulse})`,
              flexShrink: 0,
            }}
          >
            {copy.portfolio.hire}
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          {trim(copy.portfolio.projects, compact, 2).map((title, i) => (
            <ProjectCard key={title} p={p} title={title} delay={base + 34 + i * 10} strong={i === 1} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProjectCard({ p, title, delay, strong }: { p: Palette; title: string; delay: number; strong: boolean }) {
  const e = useEnter(delay, 13);
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 12,
        border: `1px solid ${p.border}`,
        background: p.raised,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        opacity: e,
        transform: `scale(${0.88 + e * 0.12})`,
      }}
    >
      {/* Görsel alanı kartı doldurur (sabit yükseklik alt köşede sıkışık duruyordu). */}
      <div
        style={{
          flex: 1,
          borderRadius: 8,
          marginBottom: 12,
          background: `linear-gradient(150deg, ${p.accent}${strong ? "55" : "33"}, transparent)`,
        }}
      />
      <span style={{ fontSize: 15, fontWeight: 700, color: p.text }}>{title}</span>
    </div>
  );
}

/* ── Sahne 5: CV ───────────────────────────────────────────────────── */

function CvScene({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const style = useSceneStyle(4);
  const compact = useCompact();
  const frame = useCurrentFrame();
  const base = SCENES[4]!.start;
  const ats = interpolate(frame, [base + 40, base + 82], [0, 96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dl = useEnter(base + 86, 11);
  return (
    <div style={style}>
      <Headline p={p} text={copy.headline.cv} delay={base + 2} />
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {/* Şablon yelpazesi */}
        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          {trim(copy.cv.templates, compact, 2).map((name, i) => (
            <TemplateCard key={name} p={p} name={name} delay={base + 12 + i * 9} tilt={(i - 1) * 3} />
          ))}
        </div>
        {/* ATS skoru + indir */}
        <Card p={p} style={{ width: compact ? 200 : 250, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <ScoreRing p={p} value={ats} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: p.textSubtle }}>
            {copy.cv.atsLabel}
          </span>
          <span
            style={{
              padding: "11px 20px",
              borderRadius: 12,
              background: p.accent,
              color: "#04121a",
              fontSize: 15,
              fontWeight: 800,
              opacity: dl,
              transform: `translateY(${(1 - dl) * 10}px)`,
            }}
          >
            ↓ {copy.cv.download}
          </span>
        </Card>
      </div>
    </div>
  );
}

function TemplateCard({ p, name, delay, tilt }: { p: Palette; name: string; delay: number; tilt: number }) {
  const e = useEnter(delay, 14);
  return (
    <Card
      p={p}
      style={{
        flex: 1,
        padding: 14,
        opacity: e,
        transform: `translateY(${(1 - e) * 22}px) rotate(${tilt * e}deg)`,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {/* CV iskeleti: başlık + iki "bölüm" — kart ortası boş kalmasın, gerçek sayfa gibi dursun. */}
      <div style={{ height: 9, width: "55%", borderRadius: 3, background: p.accent }} />
      <div style={{ height: 6, width: "78%", borderRadius: 3, background: p.textSubtle }} />
      <div style={{ height: 1, background: p.border, margin: "5px 0" }} />
      {[92, 80, 88, 62].map((w, j) => (
        <div key={`a${j}`} style={{ height: 5, width: `${w}%`, borderRadius: 3, background: p.border }} />
      ))}
      <div style={{ height: 6, width: "38%", borderRadius: 3, background: p.textSubtle, marginTop: 10 }} />
      {[86, 74, 90, 68, 82, 58].map((w, j) => (
        <div key={`b${j}`} style={{ height: 5, width: `${w}%`, borderRadius: 3, background: p.border }} />
      ))}
      <span style={{ marginTop: "auto", paddingTop: 10, fontSize: 13, fontWeight: 700, color: p.textMuted }}>{name}</span>
    </Card>
  );
}

function ScoreRing({ p, value }: { p: Palette; value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 116, height: 116 }}>
      <svg width={116} height={116} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={58} cy={58} r={r} fill="none" stroke={p.border} strokeWidth={9} />
        <circle
          cx={58}
          cy={58}
          r={r}
          fill="none"
          stroke={p.accent}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 30,
          fontWeight: 800,
          color: p.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

/* ── Pencere kabuğu (kalıcı) ───────────────────────────────────────── */

function Chrome({ p, copy }: { p: Palette; copy: ShowcaseCopy }) {
  const frame = useCurrentFrame();
  const compact = useCompact();
  const scene = activeScene(frame);
  const activeIdx = activeSceneIndex(frame);
  // URL sahne değişiminde kısa bir fade ile tazelenir.
  const urlFade = interpolate(frame, [scene.start, scene.start + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {/* Üst çubuk */}
      <div
        style={{
          height: 46,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          background: p.raised,
          borderBottom: `1px solid ${p.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", gap: 7 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.85 }} />
          ))}
        </span>
        <span
          style={{
            marginLeft: 10,
            flex: 1,
            padding: "6px 14px",
            borderRadius: 8,
            background: p.surface,
            border: `1px solid ${p.border}`,
            fontSize: 14,
            fontWeight: 600,
            color: p.textMuted,
            opacity: 0.5 + urlFade * 0.5,
          }}
        >
          {scene.url}
        </span>
      </div>
      {/* Gövde: sol adım rayı + sahne alanı */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <aside
          style={{
            width: 196,
            flexShrink: 0,
            borderRight: `1px solid ${p.border}`,
            background: p.raised,
            padding: "20px 14px",
            // Kompakt (mobil) modda adım rayı gizlenir — dar tuvalde sahneye yer açar.
            display: compact ? "none" : "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {SCENES.map((s, i) => {
            const on = i === activeIdx;
            const done = i < activeIdx;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: on ? p.accentSoft : "transparent",
                  border: `1px solid ${on ? p.accent : "transparent"}`,
                  transition: "none",
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: on ? p.accent : done ? p.success : p.textSubtle,
                    opacity: on || done ? 1 : 0.45,
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: on ? 800 : 600,
                    color: on ? p.text : p.textMuted,
                  }}
                >
                  {copy.steps[s.id]}
                </span>
              </div>
            );
          })}
        </aside>
        <div style={{ flex: 1, position: "relative", background: p.surface, minWidth: 0 }}>
          <ProfileScene p={p} copy={copy} />
          <FeedScene p={p} copy={copy} />
          <ProposalScene p={p} copy={copy} />
          <PortfolioScene p={p} copy={copy} />
          <CvScene p={p} copy={copy} />
        </div>
      </div>
    </>
  );
}

/* ── Kompozisyon kökü ──────────────────────────────────────────────── */

/* `interface` DEĞİL `type`: Remotion `Composition` propları `Record<string, unknown>`a
   atanabilir olmalı — interface'lerin örtük index imzası yoktur, type alias'ların vardır. */
export type ShowcaseVideoProps = {
  palette?: Palette;
  copy: ShowcaseCopy;
  /** Dar ekran (mobil) varyantı: içerik iri çizilir, adım rayı gizlenir. */
  compact?: boolean;
};

export function ShowcaseVideo({ palette, copy, compact = false }: ShowcaseVideoProps) {
  const p = palette ?? PALETTES.dark;
  // Kompakt modda daha küçük mantıksal tuvale çizip büyüterek okunurluk kazanılır.
  const zoom = compact ? COMPACT_ZOOM : 1;
  return (
    <CompactContext.Provider value={compact}>
      <AbsoluteFill style={{ background: p.canvas, fontFamily: FONT }}>
        {/* Zeminde imza cyan parıltı (dekoratif). */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 22% 8%, ${p.accentSoft}, transparent 55%)`,
          }}
        />
        <AbsoluteFill
          style={{
            // Mantıksal boyut tuvalin 1/zoom'u; scale ile tam 1280×720'ye açılır.
            width: VIDEO.width / zoom,
            height: VIDEO.height / zoom,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            padding: compact ? 18 : 34,
            display: "flex",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: 18,
              overflow: "hidden",
              background: p.surface,
              border: `1px solid ${p.border}`,
              boxShadow: p.shadow,
            }}
          >
            <Chrome p={p} copy={copy} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </CompactContext.Provider>
  );
}

/** Remotion Studio / MP4 export için varsayılan kopya (landing kendi i18n'ini geçirir). */
export const DEFAULT_COPY: ShowcaseCopy = {
  steps: { profile: "Profile", feed: "Jobs", proposal: "Proposal", portfolio: "Portfolio", cv: "CV" },
  headline: {
    profile: "Enter your work once",
    feed: "Get a live job feed, scored to you",
    proposal: "AI writes the proposal",
    portfolio: "Publish a portfolio that wins clients",
    cv: "Export an ATS-ready CV",
  },
  profile: {
    headline: "Senior React Developer",
    skills: ["React", "Next.js", "TypeScript", "Node", "UI/UX", "Tailwind"],
  },
  feed: {
    scoreLabel: "fit",
    jobs: [
      { title: "React dashboard build", platform: "Upwork", score: 92, budget: "$45/hr" },
      { title: "Next.js landing page", platform: "LinkedIn", score: 78, budget: "$3k" },
      { title: "UI/UX for SaaS app", platform: "Fiverr", score: 85, budget: "$800" },
      { title: "Landing page revamp", platform: "Upwork", score: 88, budget: "$1.2k" },
    ],
  },
  proposal: {
    text: "Hi! I read your post — I've shipped three similar React dashboards. Here's how I'd approach yours…",
    autoPilot: "Auto-Pilot",
    on: "ON",
    noAutoSubmit: "Never auto-submitted",
  },
  portfolio: {
    name: "Ahmet Yilmaz",
    role: "Product Designer",
    hire: "Hire me",
    projects: ["Fintech app", "Design system", "SaaS dashboard"],
  },
  cv: {
    role: "Senior React Developer",
    download: "Download PDF",
    atsLabel: "ATS score",
    templates: ["Clean", "Modern", "Sidebar"],
  },
};

export const SHOWCASE_VIDEO = VIDEO;
