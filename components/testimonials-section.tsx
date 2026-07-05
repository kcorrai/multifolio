import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  platform: string;
}

// Sosyal kanıt bölümü. İçerik i18n `landing.testimonials.items`'tan gelir —
// beta boyunca YER TUTUCU (gerçek kullanıcı sözleri geldikçe değiştirilir).
// Yalnızca yorum metni gösterilir (kimlik/avatar yok — sahte kişi izlenimi vermez).
// Sunumu: sağa kayan sonsuz marquee (CSS-only; hover'da durur, reduced-motion'da freeze).
export async function TestimonialsSection() {
  const t = await getTranslations("landing.testimonials");
  const items = t.raw("items") as Testimonial[];
  if (!Array.isArray(items) || items.length === 0) return null;

  const quotes = items.map((it) => it.quote);
  // Bir "yarım" = yorumlar geniş ekranı da dolduracak kadar tekrar (boşluk kalmasın).
  // Şerit bu yarımı İKİ kez basar; -50% kaydırma dikişsiz döngü verir.
  const repeats = Math.max(2, Math.ceil(6 / quotes.length));
  const half = Array.from({ length: repeats }, () => quotes).flat();

  return (
    <section className="py-24 overflow-hidden">
      <ScrollReveal>
        <div className="text-center space-y-3 mb-12 px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("eyebrow")}</p>
          <h2 className="text-4xl font-extrabold tracking-tight">{t("title")}</h2>
        </div>
      </ScrollReveal>

      {/* Kenarlarda yumuşak solma (mask) + hover'da durma grubu */}
      <div
        className="anim-marquee-group relative [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        style={{ "--marquee-dur": "50s" } as CSSProperties}
      >
        <div className="anim-marquee-track flex gap-5">
          <MarqueeHalf quotes={half} />
          <MarqueeHalf quotes={half} ariaHidden />
        </div>
      </div>
    </section>
  );
}

// Şeridin bir kopyası. İkinci kopya ekran okuyucudan gizlenir (yinelenmesin).
function MarqueeHalf({ quotes, ariaHidden = false }: { quotes: string[]; ariaHidden?: boolean }) {
  return (
    <ul className="flex shrink-0 gap-5" aria-hidden={ariaHidden || undefined}>
      {quotes.map((quote, i) => (
        <li key={i} className="shrink-0">
          <figure className="flex h-full w-[340px] flex-col rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 shadow-sm">
            <Quote className="h-6 w-6 shrink-0 text-[#00F0FF]/50" aria-hidden />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 dark:text-[#CBD5E1]">
              “{quote}”
            </blockquote>
          </figure>
        </li>
      ))}
    </ul>
  );
}
