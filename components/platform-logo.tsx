import type { PlatformId } from "@/lib/ai/platforms";

interface Props {
  platform: PlatformId;
  size?: number;
  className?: string;
}

export function PlatformLogo({ platform, size = 20, className = "" }: Props) {
  const s = { width: size, height: size, className, "aria-hidden": true as const };

  switch (platform) {
    case "linkedin":
      return (
        <svg {...s} viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );

    case "upwork":
      return (
        <svg {...s} viewBox="0 0 24 24" fill="#6FDA44">
          <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.545-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
        </svg>
      );

    case "fiverr":
      // Küçük boyutta okunur letter-mark (tam wordmark "irerr" gibi bozuluyordu) —
      // Bionluk/Armut deseni: markalı yeşil kare + beyaz "fi".
      return <LetterMark {...s} fill="#1DBF73" label="fi" />;

    // Yeni platformlar (Dalga 1): markalı renkli kare + beyaz letter-mark. Küçük
    // boyutta okunurluk için letter-mark deseni (fiverr gibi); tam wordmark bozulur.
    case "freelancer":
      return <LetterMark {...s} fill="#0EA5E9" label="fl" />;
    case "contra":
      return <LetterMark {...s} fill="#8B5CF6" label="C" fontSize={14} />;
    case "peopleperhour":
      return <LetterMark {...s} fill="#F97316" label="P" fontSize={14} />;
    case "99designs":
      return <LetterMark {...s} fill="#EC4899" label="99" />;
    case "guru":
      return <LetterMark {...s} fill="#14B8A6" label="G" fontSize={14} />;
  }
}

// Ortak letter-mark: markalı yuvarlak kare + beyaz metin (küçük boyutta okunur).
function LetterMark({
  fill, label, fontSize = 13, ...s
}: {
  fill: string;
  label: string;
  fontSize?: number;
  width: number;
  height: number;
  className: string;
  "aria-hidden": true;
}) {
  return (
    <svg {...s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill={fill} />
      <text
        x="12" y="17" textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize={fontSize} fill="white"
      >
        {label}
      </text>
    </svg>
  );
}
