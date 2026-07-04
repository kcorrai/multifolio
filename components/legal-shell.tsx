import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Yasal prose sayfaları için ortak kabuk (Gizlilik / Şartlar / KVKK).
// Çözülmüş string'ler prop olarak gelir → çağıran sayfa kendi LİTERAL i18n
// namespace'iyle getTranslations yapar (tip güvenli; dinamik namespace yok).
export interface LegalSection { title: string; body: string }

export function LegalShell({
  isLoggedIn, eyebrow, title, updated, intro, draftNotice, sections,
}: {
  isLoggedIn: boolean;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  draftNotice: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <SiteHeader isLoggedIn={isLoggedIn} />

      <section className="mx-auto max-w-3xl px-8 pt-20 pb-24 space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{eyebrow}</p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium">{updated}</p>
          <p className="text-lg text-slate-600 dark:text-[#94A3B8] leading-relaxed font-medium">{intro}</p>
        </div>

        {/* Taslak uyarısı: metinler bilgilendirme amaçlı, hukuki inceleme önerilir. */}
        <div className="rounded-xl border border-amber-300/50 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {draftNotice}
        </div>

        {sections.map(({ title: sTitle, body }) => (
          <div key={sTitle} className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">{sTitle}</h2>
            <p className="text-slate-600 dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">{body}</p>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
