// Solar Pop paylaşılan sunum parçaları (app/solar-pop.css sınıflarını kullanır).
// Hook/handler İÇERMEZ → hem sunucu hem client bileşenlerinden import edilebilir;
// onClick alan parçalar yalnızca client çağıranlarda anlamlıdır.
// Referans komp: docs/design/solar-pop/multifolio-free-tools-solar-pop.html
import type { CSSProperties, ReactNode } from "react";
import { Asterisk, Check, X, ArrowUpRight, type LucideIcon } from "lucide-react";

/* ─── Dekoratif blob ────────────────────────────────────────────────────
   Daima tek düz renk, daima dekoratif — asla içerik taşımaz. */
export type BlobShape = "circle" | "blob" | "petal" | "arch";

export function Blob({
  size, color, shape = "blob", opacity = 1, rotate, style,
}: {
  size: number;
  color: string;
  shape?: BlobShape;
  opacity?: number;
  /** Derece — özellikle "petal" kenardan taşarken dikdörtgen gibi görünmesin diye. */
  rotate?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`sp-blob sp-blob--${shape}`}
      style={{
        width: size, height: size, background: color, opacity,
        ...(rotate ? { transform: `rotate(${rotate}deg)` } : null),
        ...style,
      }}
    />
  );
}

/** Blob katmanı: konumlandırılmış bir kabın içine mutlak yerleşir. */
export function Blobs({ children }: { children: ReactNode }) {
  return <div aria-hidden className="sp-blobs">{children}</div>;
}

/* ─── Kart ─────────────────────────────────────────────────────────── */
export type CardTone = "white" | "tint" | "pink" | "peach" | "amber" | "flame" | "ink";

const CARD_TONE: Record<CardTone, string> = {
  white: "", tint: "sp-card--tint", pink: "sp-card--pink", peach: "sp-card--peach",
  amber: "sp-card--amber", flame: "sp-card--flame", ink: "sp-card--ink",
};

export function Card({
  children, tone = "white", small, className = "", style, id,
}: {
  children: ReactNode;
  tone?: CardTone;
  small?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  return (
    <div id={id} className={`sp-card ${CARD_TONE[tone]} ${small ? "sp-card--sm" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Kart başlığı: sola başlık, sağa opsiyonel yardımcı (canlı rozeti, sayaç…). */
export function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="sp-title mr-auto">{title}</h2>
      {right}
    </div>
  );
}

/* ─── Etiket + ikon diski ──────────────────────────────────────────── */
export function Label({ children, tone = "pink" }: { children: ReactNode; tone?: "pink" | "flame" | "muted" | "body" }) {
  const cls = tone === "body" ? "" : `sp-label--${tone}`;
  return <span className={`sp-label ${cls}`}>{children}</span>;
}

/** Glif diski — sistemin ikon yerleşimi: pembe/beyaz hap içinde outline glif. */
export function Disc({
  icon: Icon, size = 34, bg = "var(--surface-card-alt)", color = "var(--pink-600)", glyph,
}: {
  icon: LucideIcon;
  size?: number;
  bg?: string;
  color?: string;
  glyph?: number;
}) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-[var(--radius-pill)]"
      style={{ width: size, height: size, background: bg, color }}
    >
      <Icon size={glyph ?? Math.round(size * 0.45)} strokeWidth={2} />
    </span>
  );
}

/* ─── Alan etiketi (başlık + ipucu) ────────────────────────────────── */
export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="grid gap-[3px]">
      <span className="sp-label" style={{ color: "var(--text-strong)" }}>{label}</span>
      {hint ? (
        <span className="sp-body" style={{ fontSize: "var(--fs-label)", lineHeight: 1.45 }}>{hint}</span>
      ) : null}
    </span>
  );
}

/* ─── Skor bloğu ────────────────────────────────────────────────────────
   Ailenin ortak skor gösterimi: rakam + kelime + glif. Renk TEK sinyal
   değildir (erişilebilirlik) — kelime ve glif her zaman eşlik eder.
   60 ve 80'deki çentikler tüm Multifolio araçlarında aynı ölçeği kurar. */
export function ScoreBlock({
  value, words, scale, scaleNote,
}: {
  value: number;
  /** Üç bant için kelime: [≥80, ≥60, <60] — renk tek sinyal olmasın diye zorunlu. */
  words: [string, string, string] | string[];
  scale: string;
  scaleNote: string;
}) {
  const band = value >= 80 ? 0 : value >= 60 ? 1 : 2;
  const bg = ["var(--surface-card-alt)", "var(--amber-200)", "var(--peach-200)"][band];
  const ink = ["var(--pink-600)", "var(--flame-600)", "var(--flame-600)"][band];
  const Glyph = [Check, Asterisk, X][band];

  return (
    <div className="grid gap-3.5 rounded-[var(--radius-sp-lg)] p-[22px]" style={{ background: bg }}>
      <div className="flex flex-wrap items-center gap-[18px]">
        <span
          className="tabular-nums"
          style={{
            font: "var(--fw-black) var(--fs-display-l)/.85 var(--font-display)",
            letterSpacing: "var(--tracking-display)", color: "var(--text-strong)",
          }}
        >
          {value}
        </span>
        <span className="grid gap-[5px]">
          <span
            className="sp-label inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] px-[13px] py-[7px]"
            style={{ background: "var(--white)", color: "var(--ink-900)" }}
          >
            <Glyph size={13} strokeWidth={2.4} />
            {words[band]}
          </span>
          <span className="sp-body sp-body--small">{scale}</span>
        </span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--white)" }}>
        <span className="absolute inset-y-0 left-0" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: ink }} />
        <span className="absolute inset-y-0 w-0.5" style={{ left: "60%", background: "var(--cream-400)" }} />
        <span className="absolute inset-y-0 w-0.5" style={{ left: "80%", background: "var(--cream-400)" }} />
      </div>

      <span className="sp-label" style={{ letterSpacing: ".06em", lineHeight: 1.4 }}>{scaleNote}</span>
    </div>
  );
}

/* ─── Büyük rakam kutusu ───────────────────────────────────────────── */
export function BigNumber({
  label, value, sub, primary,
}: {
  label: string;
  value: string;
  sub?: string;
  primary?: boolean;
}) {
  return (
    <div
      className="grid gap-[7px] rounded-[var(--radius-sp-lg)] p-[22px]"
      style={{ background: primary ? "var(--ink-900)" : "var(--surface-card-peach)" }}
    >
      <span className="sp-label" style={{ color: primary ? "var(--peach-200)" : "var(--text-body)" }}>{label}</span>
      <span
        className="tabular-nums"
        style={{
          font: `var(--fw-black) ${primary ? "var(--fs-display-m)" : "var(--fs-stat)"}/.95 var(--font-display)`,
          letterSpacing: "var(--tracking-display)",
          color: primary ? "var(--white)" : "var(--text-strong)",
        }}
      >
        {value}
      </span>
      {sub ? (
        <span className="sp-body sp-body--small" style={{ color: primary ? "var(--white)" : "var(--text-body)" }}>{sub}</span>
      ) : null}
    </div>
  );
}

/* ─── Oranlı çubuk ─────────────────────────────────────────────────── */
export function Bar({ label, pct, ink }: { label: string; pct: number; ink?: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="grid gap-[7px]">
      <div className="sp-label flex justify-between gap-2.5" style={{ letterSpacing: ".06em" }}>
        <span>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-strong)" }}>{Math.round(pct)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--cream-300)" }}>
        <div
          className="h-full rounded-[var(--radius-pill)]"
          style={{ width: `${w}%`, background: ink ?? "var(--flame-500)", transition: "width var(--dur-slow) var(--ease-pop)" }}
        />
      </div>
    </div>
  );
}

/* ─── Bulgu satırı ──────────────────────────────────────────────────── */
export type FindingLevel = "pass" | "warn" | "fail";
export interface FindingItem {
  level: FindingLevel;
  title: string;
  body: string;
}

const FINDING_STYLE: Record<FindingLevel, { bg: string; ink: string; icon: LucideIcon }> = {
  pass: { bg: "var(--surface-card-alt)", ink: "var(--pink-600)", icon: Check },
  warn: { bg: "var(--amber-200)", ink: "var(--flame-600)", icon: Asterisk },
  fail: { bg: "var(--peach-200)", ink: "var(--flame-600)", icon: X },
};

const FINDING_ORDER: Record<FindingLevel, number> = { fail: 0, warn: 1, pass: 2 };

export function Finding({ item }: { item: FindingItem }) {
  const s = FINDING_STYLE[item.level];
  return (
    <div
      className="grid gap-[13px] rounded-[var(--radius-sp-md)] p-4"
      style={{ gridTemplateColumns: "30px 1fr", background: "var(--surface-page)" }}
    >
      <Disc icon={s.icon} size={30} bg={s.bg} color={s.ink} glyph={14} />
      <span className="grid gap-[5px]">
        <span className="sp-sub" style={{ fontSize: "var(--fs-body)", lineHeight: 1.3 }}>{item.title}</span>
        <span className="sp-body sp-body--small">{item.body}</span>
      </span>
    </div>
  );
}

/** Bulgu listesi — engelleyiciler önce, sayaç başlıkta (metin çağırandan gelir). */
export function FindingsList({ items, title, countLabel }: { items: FindingItem[]; title: string; countLabel: string }) {
  const sorted = [...items].sort((a, b) => FINDING_ORDER[a.level] - FINDING_ORDER[b.level]);

  return (
    <div className="grid gap-[13px]">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="sp-sub mr-auto">{title}</h3>
        <span className="sp-label" style={{ letterSpacing: ".06em" }}>{countLabel}</span>
      </div>
      <div className="grid gap-[9px]">
        {sorted.map((f) => <Finding key={f.title} item={f} />)}
      </div>
    </div>
  );
}

/* ─── Boş durum duruşu ──────────────────────────────────────────────────
   Boş kutu ekran israfı, sahte önizleme yalan — üçüncü yol: ne kontrol
   edileceğini şimdiden söyle, sonuç gelince düzen kaymasın. */
export function EmptyStance({ title, body, items }: { title: string; body: string; items?: string[] }) {
  return (
    <div className="grid gap-3.5">
      <Disc icon={Asterisk} size={42} bg="var(--surface-card-alt)" color="var(--ink-700)" glyph={19} />
      <h2 className="sp-title">{title}</h2>
      <p className="sp-body" style={{ maxWidth: "58ch" }}>{body}</p>
      {items ? (
        <div className="grid gap-[9px]">
          {items.map((x) => (
            <span
              key={x}
              className="flex items-center gap-[11px] rounded-[var(--radius-sp-md)] px-[15px] py-[13px]"
              style={{
                background: "var(--surface-page)",
                font: "var(--fw-bold) var(--fs-body-s)/1 var(--font-display)",
                textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-body)",
              }}
            >
              <span className="h-[7px] w-[7px] rounded-[var(--radius-pill)]" style={{ background: "var(--pink-400)" }} />
              {x}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Paylaşım imzası ───────────────────────────────────────────────────
   Sonuç kartları ekran görüntüsü alınıp paylaşılıyor: bağlamdan koparıldığında
   nereden geldiği okunsun diye mütevazı bir künye. */
export function ShareMark({ href, note }: { href: string; note: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 pt-3.5"
      style={{ borderTop: "2px dashed rgba(58,36,27,.16)" }}
    >
      <span className="sp-label inline-flex items-center gap-2">
        <span
          className="inline-grid h-[18px] w-[18px] place-items-center rounded-[var(--radius-pill)]"
          style={{ background: "var(--flame-500)", color: "var(--white)", font: "var(--fw-black) 10px/1 var(--font-display)" }}
        >
          m
        </span>
        multifolio.app{href}
      </span>
      <span className="sp-label inline-flex items-center gap-[7px]">
        <ArrowUpRight size={13} />
        {note}
      </span>
    </div>
  );
}

/* ─── Mobil yapışkan sonuç çubuğu ───────────────────────────────────────
   Telefonda girdi ile sonuç aynı ekrana sığmaz. Girdi kazanır (kullanıcı oraya
   yazıyor), baş rakam altta sabit kalır ve #result'a atlar. Masaüstünde gizli. */
export function StickyResult({ label, value, cta }: { label: string; value: string; cta: string }) {
  return (
    <div className="sp-sticky">
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="sp-label" style={{ color: "var(--white)" }}>{label}</span>
        <span
          className="tabular-nums whitespace-nowrap"
          style={{ font: "var(--fw-black) var(--fs-title)/1 var(--font-display)", color: "var(--white)" }}
        >
          {value}
        </span>
      </span>
      <a
        href="#result"
        className="sp-label inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] px-4"
        style={{ background: "var(--white)", color: "var(--text-strong)" }}
      >
        {cta}
        <ArrowUpRight size={13} />
      </a>
    </div>
  );
}

/* ─── İki kolon: yapışkan girdi rayı + sonuç ────────────────────────────
   Sonuç kolonu #result çapasını taşır (mobil yapışkan çubuk oraya atlar). */
export function TwoCol({ inputs, output }: { inputs: ReactNode; output: ReactNode }) {
  return (
    <div className="sp-twocol grid items-start gap-[22px]">
      <div className="sp-twocol__in grid min-w-0 gap-[18px]">{inputs}</div>
      <div id="result" className="grid min-w-0 gap-5 scroll-mt-5">{output}</div>
    </div>
  );
}
