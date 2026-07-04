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
// Bilerek initials-avatar kullanılır (sahte kişi fotoğrafı değil).
export async function TestimonialsSection() {
  const t = await getTranslations("landing.testimonials");
  const items = t.raw("items") as Testimonial[];
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-8 py-24">
      <ScrollReveal>
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("eyebrow")}</p>
          <h2 className="text-4xl font-extrabold tracking-tight">{t("title")}</h2>
        </div>
      </ScrollReveal>

      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item, i) => (
          <ScrollReveal key={item.name} delay={i * 90}>
            <figure className="h-full flex flex-col rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 shadow-sm">
              <Quote className="h-6 w-6 text-[#00F0FF]/50 shrink-0" aria-hidden />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 dark:text-[#CBD5E1]">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 dark:border-white/6 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00F0FF]/20 to-violet-500/20 border border-[#00F0FF]/20 text-sm font-bold text-[#00F0FF]">
                  {initials(item.name)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{item.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                    {item.role} · {item.platform}
                  </span>
                </span>
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

// "Ayşe K." → "AK"
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
