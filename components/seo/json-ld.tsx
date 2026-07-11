// JSON-LD structured data enjekte eder (arama motoru zengin sonuçları).
// `<` kaçırılır → script'ten kaçış/XSS önlenir (veri i18n/sabit → güvenli zaten).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
