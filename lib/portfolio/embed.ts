// Güvenli gömme (embed) çözücü (SAF): kullanıcının verdiği URL'i YALNIZCA
// allowlist'teki bilinen host'lar için sabit bir embed iframe src'sine çevirir.
// Rastgele iframe src'si ASLA üretilmez (XSS/clickjacking'e karşı). https zorunlu,
// ID'ler regex ile doğrulanır. Desteklenen: YouTube, Vimeo, Loom, Figma.

export interface SafeEmbed {
  src: string;
  provider: "youtube" | "vimeo" | "loom" | "figma";
}

export function getSafeEmbed(input: string | null | undefined): SafeEmbed | null {
  const url = (input || "").trim();
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v") ?? "";
    if (/^[\w-]{6,20}$/.test(id)) return { src: `https://www.youtube.com/embed/${id}`, provider: "youtube" };
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (/^[\w-]{6,20}$/.test(id)) return { src: `https://www.youtube.com/embed/${id}`, provider: "youtube" };
  }

  // Vimeo
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
    if (/^\d{6,12}$/.test(id)) return { src: `https://player.vimeo.com/video/${id}`, provider: "vimeo" };
  }

  // Loom
  if (host === "loom.com") {
    const parts = u.pathname.split("/").filter(Boolean); // /share/{id}
    if (parts[0] === "share" && /^[a-f0-9]{16,40}$/i.test(parts[1] ?? "")) {
      return { src: `https://www.loom.com/embed/${parts[1]}`, provider: "loom" };
    }
  }

  // Figma (embed host + orijinal url'i encode ederek geçirir; sabit figma domaini)
  if (host === "figma.com") {
    if (/^\/(file|design|proto|board)\//.test(u.pathname)) {
      return { src: `https://www.figma.com/embed?embed_host=multifolio&url=${encodeURIComponent(url)}`, provider: "figma" };
    }
  }

  return null;
}
