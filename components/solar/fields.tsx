// Solar Pop form alanları — araç hesaplayıcılarının paylaştığı girdi parçaları.
// Değer STRING tutulur (kullanıcı "12." yazarken alan zıplamasın); hesaplama
// çağıranda parse edilir. Hook yok → çağıran client bileşen olmalı.
import type { ReactNode } from "react";
import { FieldLabel } from "./primitives";

/* ─── Sayı alanı (ön ek/son ek + kendi artır-azalt yığını) ──────────── */
export function NumField({
  id, label, hint, value, onChange, prefix, suffix, step = 1, min = 0,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  const nudge = (dir: 1 | -1) => {
    const n = parseFloat(value.replace(",", ".")) || 0;
    onChange(String(Math.max(min, Math.round((n + dir * step) * 100) / 100)));
  };

  return (
    <label htmlFor={id} className="grid min-w-0 gap-[7px]">
      <FieldLabel label={label} hint={hint} />
      <div className="sp-fieldwrap">
        {prefix ? (
          <span style={{ font: "var(--fw-black) var(--fs-body)/1 var(--font-display)", color: "var(--flame-600)" }}>
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="sp-input sp-input--num"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? (
          <span className="sp-label whitespace-nowrap" style={{ letterSpacing: ".06em" }}>{suffix}</span>
        ) : null}
        {/* Ok yığını dekoratif kısayol: klavye zaten alanın kendisiyle çalışır. */}
        <span className="grid shrink-0 gap-[3px]">
          {([1, -1] as const).map((d) => (
            <button
              key={d}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => nudge(d)}
              className="grid h-4 w-[26px] cursor-pointer place-items-center rounded-md border-none p-0 leading-[0]"
              style={{ background: "var(--white)", color: "var(--text-body)", boxShadow: "var(--shadow-soft)" }}
            >
              <span
                style={{
                  width: 0, height: 0,
                  borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                  borderBottom: d > 0 ? "5px solid currentColor" : "none",
                  borderTop: d > 0 ? "none" : "5px solid currentColor",
                }}
              />
            </button>
          ))}
        </span>
      </div>
    </label>
  );
}

/* ─── Kaydırıcı (ray bizim, tutamak tarayıcının) ───────────────────── */
export function SliderField({
  id, label, hint, value, onChange, min, max, step = 1, suffix = "",
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / Math.max(1, max - min)) * 100));

  return (
    <div className="grid min-w-0 gap-[9px]">
      <div className="flex items-baseline justify-between gap-2.5">
        <label htmlFor={id}><FieldLabel label={label} hint={hint} /></label>
        <span
          className="tabular-nums whitespace-nowrap"
          style={{ font: "var(--fw-black) var(--fs-body-l)/1 var(--font-display)", color: "var(--flame-600)" }}
        >
          {value}{suffix}
        </span>
      </div>
      <div className="relative grid h-6 items-center">
        <span
          aria-hidden
          className="absolute inset-x-0 h-1.5 rounded-[var(--radius-pill)]"
          style={{ background: "var(--cream-400)" }}
        />
        <span
          aria-hidden
          className="absolute left-0 h-1.5 rounded-[var(--radius-pill)]"
          style={{ width: `${pct}%`, background: "var(--flame-500)" }}
        />
        <input
          id={id}
          type="range"
          className="relative"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      <div aria-hidden className="sp-label flex justify-between" style={{ letterSpacing: ".06em" }}>
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

/* ─── Tek satır metin alanı ────────────────────────────────────────── */
export function TextField({
  id, label, hint, value, onChange, placeholder, leading, trailing, error,
  autoFocus, type = "text", autoComplete, required, disabled, aside,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  error?: string | null;
  autoFocus?: boolean;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  /** Etiket satırının sağına (ör. "Forgot?" bağlantısı). */
  aside?: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-[9px]">
      <div className="flex items-baseline justify-between gap-2.5">
        <label htmlFor={id}><FieldLabel label={label} hint={hint} /></label>
        {aside}
      </div>
      <div className={`sp-fieldwrap ${error ? "sp-fieldwrap--error" : ""}`} style={{ minHeight: 50 }}>
        {leading ? (
          <span style={{ color: error ? "var(--pink-600)" : "var(--text-muted)", display: "inline-flex" }}>{leading}</span>
        ) : null}
        <input
          id={id}
          name={id}
          className="sp-input"
          type={type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing}
      </div>
      {error ? (
        <span
          id={`${id}-err`}
          role="alert"
          className="sp-body sp-body--small inline-flex items-center gap-[7px]"
          style={{ color: "var(--pink-600)" }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* ─── Çok satır metin alanı (kelime sayacı + gizlilik notu ile) ────── */
export function TextAreaField({
  id, label, hint, value, onChange, rows = 12, countLabel, note,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  countLabel: string;
  note: string;
}) {
  return (
    <div className="grid min-w-0 gap-[9px]">
      <label htmlFor={id}><FieldLabel label={label} hint={hint} /></label>
      <textarea
        id={id}
        className="sp-textarea"
        rows={rows}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="sp-label flex justify-between gap-2.5" style={{ letterSpacing: ".06em" }}>
        <span>{countLabel}</span>
        <span>{note}</span>
      </div>
    </div>
  );
}
