"use client";

// Auth kabuğu — Solar Pop tasarımı ("bilet" kompozisyonu).
// Referans komp: docs/design/solar-pop/multifolio-auth-solar-pop.html
//
// TASARIM KARARI (komp'tan): eski %58'lik pazarlama paneli KALDIRILDI. "Neden"
// artık formun üstünde üç maddelik ince bir şerit; şerit ile form arasındaki
// PERFORASYON ikisini tek bilet gibi bağlar — rakip bir panel değil. h1 forma
// aittir; kenar sütunu küçük tutulur ve mobilde tamamen düşer.
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sun, Globe, Package, Heart, ArrowRight, Check, X, Eye, EyeOff } from "lucide-react";

/* ─── Bilet: şerit + perforasyon + gövde ───────────────────────────── */
export type StubKind = "benefits" | "welcome" | "referral" | "none";

const STUB_ITEMS = [
  { key: "credits", icon: Sun },
  { key: "platforms", icon: Globe },
  { key: "outputs", icon: Package },
] as const;

/** Perforasyon: iki yandan krem daireler + kesikli çizgi (biletin yırtma yeri). */
function Perforation() {
  return (
    <div aria-hidden className="relative mx-[-28px] h-5">
      <span
        className="absolute top-0 h-[22px] w-[22px] rounded-[var(--radius-pill)]"
        style={{ left: -11, background: "var(--surface-page)" }}
      />
      <span
        className="absolute top-0 h-[22px] w-[22px] rounded-[var(--radius-pill)]"
        style={{ right: -11, background: "var(--surface-page)" }}
      />
      <span className="absolute left-5 right-5 top-[10px]" style={{ borderTop: "2px dashed rgba(58,36,27,.2)" }} />
    </div>
  );
}

function Stub({ kind, referrer }: { kind: StubKind; referrer?: string }) {
  const t = useTranslations("auth.sp.stub");

  if (kind === "none") return null;

  if (kind === "referral") {
    return (
      <div className="grid gap-3 px-7 pb-1.5 pt-5" style={{ background: "var(--surface-pink)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-pill)]"
            style={{ background: "var(--white)", color: "var(--pink-600)" }}
          >
            <Heart size={17} />
          </span>
          <span className="grid min-w-0 gap-[3px]">
            <span
              style={{
                font: "var(--fw-black) var(--fs-body-l)/1.2 var(--font-display)",
                textTransform: "uppercase", letterSpacing: ".02em", color: "var(--white)",
              }}
            >
              {referrer ? t("referralTitleNamed", { name: referrer }) : t("referralTitle")}
            </span>
            <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1.5 var(--font-body)", color: "var(--white)" }}>
              {t("referralBody")}
            </span>
          </span>
        </div>
        <Perforation />
      </div>
    );
  }

  if (kind === "welcome") {
    return (
      <div className="grid gap-3 px-7 pb-1.5 pt-5" style={{ background: "var(--surface-card-peach)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--radius-pill)]"
            style={{ background: "var(--white)", color: "var(--flame-600)" }}
          >
            <Sun size={16} />
          </span>
          <span style={{ font: "var(--fw-bold) var(--fs-body-s)/1.5 var(--font-body)", color: "var(--text-body)" }}>
            {t("welcome")}
          </span>
        </div>
        <Perforation />
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 px-7 pb-1.5 pt-5" style={{ background: "var(--surface-card-peach)" }}>
      <div className="sp-stub grid gap-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {STUB_ITEMS.map(({ key, icon: Icon }) => (
          <span key={key} className="grid gap-1">
            <span
              className="inline-grid h-[30px] w-[30px] place-items-center rounded-[var(--radius-pill)]"
              style={{ background: "var(--white)", color: "var(--flame-600)" }}
            >
              <Icon size={14} />
            </span>
            <span
              style={{
                font: "var(--fw-black) var(--fs-body)/1.15 var(--font-display)",
                textTransform: "uppercase", letterSpacing: ".02em", color: "var(--text-strong)",
              }}
            >
              {t(`${key}.title`)}
            </span>
            <span style={{ font: "var(--fw-regular) var(--fs-label)/1.4 var(--font-body)", color: "var(--text-muted)" }}>
              {t(`${key}.sub`)}
            </span>
          </span>
        ))}
      </div>
      <Perforation />
    </div>
  );
}

/* ─── Kenar sütunu: kanıt, kasten küçük ────────────────────────────── */
function AuthAside({ variant }: { variant: "signup" | "login" }) {
  const t = useTranslations("auth.sp.aside");

  return (
    <aside className="sp-authaside grid content-start gap-4">
      <div
        className="relative grid gap-3 overflow-hidden rounded-[var(--radius-sp-xl)] p-[22px]"
        style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-soft)" }}
      >
        <span
          aria-hidden
          className="sp-blob sp-blob--circle"
          style={{ width: 120, height: 120, background: "var(--pink-200)", right: -40, top: -40 }}
        />
        <span className="relative" style={{ font: "400 40px/1 var(--font-script)", color: "var(--text-heading)" }}>“</span>
        <p className="relative" style={{ font: "var(--fw-medium) var(--fs-body-s)/1.6 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>
          {t("quote")}
        </p>
        <span className="sp-label sp-label--muted relative" style={{ lineHeight: 1.4 }}>{t("quoteBy")}</span>
      </div>

      <div className="grid gap-2.5 rounded-[var(--radius-sp-xl)] p-5" style={{ background: "var(--surface-card-alt)" }}>
        <span className="sp-label sp-label--pink">{t("noCardTitle")}</span>
        <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1.6 var(--font-body)", color: "var(--text-body)" }}>
          {t(variant === "login" ? "noCardLogin" : "noCardSignup")}
        </span>
      </div>

      <div
        className="grid gap-2.5 rounded-[var(--radius-sp-xl)] p-5"
        style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-soft)" }}
      >
        <span className="sp-label sp-label--flame">{t("toolsTitle")}</span>
        <span style={{ font: "var(--fw-regular) var(--fs-body-s)/1.6 var(--font-body)", color: "var(--text-body)" }}>
          {t("toolsBody")}
        </span>
        <Link href="/rate" className="sp-linkish">
          {t("toolsCta")}
          <ArrowRight size={13} />
        </Link>
      </div>
    </aside>
  );
}

/* ─── Kabuk ─────────────────────────────────────────────────────────── */
export function AuthLayout({
  children, stub = "benefits", aside = "signup", helper, referrer, altRoute,
}: {
  children: ReactNode;
  stub?: StubKind;
  /** Kenar sütununun tonu; null → kenar sütunu yok (dar tek kolon). */
  aside?: "signup" | "login" | null;
  helper?: { text: string; label: string; href: string };
  referrer?: string;
  altRoute?: ReactNode;
}) {
  return (
    <div className="sp-page grid" style={{ padding: "28px 24px 64px" }}>
      <div aria-hidden className="sp-blobs">
        <span className="sp-blob sp-blob--blob" style={{ width: 320, height: 320, background: "var(--peach-200)", left: -120, top: 40, opacity: 0.7 }} />
        <span className="sp-blob sp-blob--petal" style={{ width: 240, height: 240, background: "var(--pink-300)", right: -90, bottom: 60, opacity: 0.55, transform: "rotate(20deg)" }} />
        <span className="sp-blob sp-blob--circle" style={{ width: 130, height: 130, background: "var(--amber-200)", right: "18%", top: -50 }} />
      </div>

      <div className="relative z-[2] mx-auto grid w-full max-w-[1000px] gap-5">
        {/* Üst satır: marka + karşı rota */}
        <div className="flex flex-wrap items-center gap-3.5">
          <Link href="/" className="mr-auto flex items-center gap-[11px]">
            <span
              className="inline-grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-pill)]"
              style={{ background: "var(--action-primary)", color: "var(--white)", font: "var(--fw-black) 16px/1 var(--font-display)" }}
            >
              m
            </span>
            <span
              style={{
                font: "var(--fw-black) 19px/1 var(--font-display)",
                letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
              }}
            >
              multifolio
            </span>
          </Link>
          {helper ? (
            <>
              <span style={{ font: "var(--fw-medium) var(--fs-body-s)/1 var(--font-body)", color: "var(--text-muted)" }}>
                {helper.text}
              </span>
              <Link href={helper.href} className="sp-btn sp-btn--sm sp-btn--ghost">{helper.label}</Link>
            </>
          ) : null}
        </div>

        <div
          className="sp-authgrid grid items-start justify-center gap-6"
          // Kenar sütunu yokken form tam genişliğe yayılmasın: iki alanlık bir
          // form 1000px'te okunmuyor, ölçülü tek kolona düşer.
          style={{ gridTemplateColumns: aside ? "minmax(0,1fr) 268px" : "minmax(0,540px)" }}
        >
          <main className="grid min-w-0 gap-4">
            <section
              className="sp-rise relative grid overflow-hidden rounded-[var(--radius-sp-xl)]"
              style={{ background: "var(--white)", boxShadow: "var(--shadow-lift)" }}
            >
              <Stub kind={stub} referrer={referrer} />
              <div className="grid gap-5 px-7 pb-7 pt-6">{children}</div>
            </section>
            {altRoute}
          </main>
          {aside ? <AuthAside variant={aside} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Form parçaları ───────────────────────────────────────────────── */

/** Sayfanın TEK h1'i forma aittir (pazarlama başlığı değil). */
export function AuthHead({ title, script, sub }: { title: string; script?: string; sub?: string }) {
  return (
    <header className="grid gap-[9px]">
      <h1
        className="sp-authh1"
        style={{
          font: "var(--fw-black) var(--fs-display-s)/1.05 var(--font-display)",
          letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
        }}
      >
        {title}
        {script ? <span className="sp-script ml-2.5" style={{ fontSize: "var(--fs-script-m)" }}>{script}</span> : null}
      </h1>
      {sub ? <p className="sp-body">{sub}</p> : null}
    </header>
  );
}

/** Şifre görünürlüğü — buradaki en sık hata yazım hatası, yer etmesi haklı. */
export function RevealButton({ on, onToggle, labelShow, labelHide }: {
  on: boolean;
  onToggle: () => void;
  labelShow: string;
  labelHide: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={on ? labelHide : labelShow}
      className="inline-grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-[var(--radius-pill)] border-none"
      style={{ background: "var(--white)", color: "var(--text-muted)", boxShadow: "var(--shadow-soft)" }}
    >
      {on ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

/** Üç kademeli güç göstergesi — 8 karakter alt sınır, 12+ güçlü. */
export function PasswordStrength({ length }: { length: number }) {
  const t = useTranslations("auth.sp.strength");
  const steps = [length >= 1, length >= 8, length >= 12];
  const label = length >= 12 ? t("strong") : length >= 8 ? t("good") : length ? t("short") : t("min");

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex flex-1 gap-[5px]" aria-hidden>
        {steps.map((on, i) => (
          <span
            key={i}
            className="h-[5px] flex-1 rounded-[var(--radius-pill)]"
            style={{
              background: on ? (i === 2 ? "var(--pink-500)" : "var(--flame-500)") : "var(--cream-400)",
              transition: "background var(--dur-base) var(--ease-out)",
            }}
          />
        ))}
      </span>
      <span className="sp-label sp-label--muted whitespace-nowrap" style={{ letterSpacing: ".08em" }}>{label}</span>
    </div>
  );
}

/** Kredi vaadi — gönder butonunun HEMEN üstünde durur. */
export function AuthPromise({ text }: { text: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2.5 rounded-[var(--radius-pill)] px-3.5 py-[11px]"
      style={{ background: "var(--surface-card-alt)" }}
    >
      <span style={{ color: "var(--pink-600)", display: "inline-flex" }}><Sun size={14} /></span>
      <span className="sp-label sp-label--pink text-center" style={{ lineHeight: 1.3 }}>{text}</span>
    </div>
  );
}

export function AuthSubmit({ label, busyLabel, busy }: { label: string; busyLabel: string; busy: boolean }) {
  return (
    <button type="submit" disabled={busy} aria-busy={busy} className="sp-btn sp-btn--lg sp-btn--block">
      {busy ? (
        <span
          className="sp-spin h-[15px] w-[15px] rounded-[var(--radius-pill)]"
          style={{ border: "2px solid rgba(255,255,255,.4)", borderTopColor: "var(--white)" }}
        />
      ) : null}
      {busy ? busyLabel : label}
    </button>
  );
}

/** Hata/bilgi bandı — asla çıkmaz sokak: her zaman bir sonraki adımı adlandırır. */
export function AuthBanner({
  tone = "info", title, body, action, actionHref, onAction,
}: {
  tone?: "info" | "danger";
  title: string;
  body?: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  const danger = tone === "danger";
  return (
    <div
      role={danger ? "alert" : "status"}
      className="sp-in grid gap-[13px] rounded-[var(--radius-sp-lg)] p-[18px]"
      style={{ gridTemplateColumns: "34px 1fr", background: danger ? "var(--pink-100)" : "var(--amber-200)" }}
    >
      <span
        className="inline-grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-pill)]"
        style={{ background: "var(--white)", color: danger ? "var(--pink-600)" : "var(--flame-600)" }}
      >
        {danger ? <X size={16} /> : <Check size={16} />}
      </span>
      <div className="grid gap-[7px]">
        <span
          style={{
            font: "var(--fw-black) var(--fs-body)/1.3 var(--font-display)",
            textTransform: "uppercase", letterSpacing: ".02em", color: "var(--text-strong)",
          }}
        >
          {title}
        </span>
        {body ? <span className="sp-body sp-body--small">{body}</span> : null}
        {action ? (
          actionHref ? (
            <Link href={actionHref} className="sp-linkish">{action} <ArrowRight size={13} /></Link>
          ) : (
            <button type="button" onClick={onAction} className="sp-linkish">{action} <ArrowRight size={13} /></button>
          )
        ) : null}
      </div>
    </div>
  );
}

/** Karşı rota kartı — biletin altında, ayrı kutu. */
export function AltRoute({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2.5 rounded-[var(--radius-sp-lg)] px-[18px] py-[15px]"
      style={{ background: "var(--surface-card)" }}
    >
      {children}
    </div>
  );
}

/** Büyük durum ikonu (inbox / süresi dolmuş / tamam ekranları). */
export function AuthIcon({ icon: Icon, tone = "pink" }: { icon: typeof Sun; tone?: "pink" | "amber" }) {
  return (
    <span
      className="inline-grid h-[50px] w-[50px] place-items-center rounded-[var(--radius-pill)]"
      style={{
        background: tone === "pink" ? "var(--surface-card-alt)" : "var(--amber-200)",
        color: tone === "pink" ? "var(--pink-600)" : "var(--flame-600)",
      }}
    >
      <Icon size={22} />
    </span>
  );
}
