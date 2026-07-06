// Multifolio Profil Aktarıcı Chrome uzantısının Chrome Web Store yayın URL'i.
// Tek doğru kaynak — uzantıya yönlendiren tüm "Yükle" CTA'ları buradan okur.
// ID-only kanonik biçim; mağaza yerelleştirilmiş slug'a yönlendirir.
export const EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/iccpbihjghfekoodcjpddcnfbnnilpbp";

// İleride gerçek bir tanıtım screencast'i eklenirse buraya URL yaz:
//  - YouTube/Loom embed URL (ör. "https://www.youtube.com/embed/XXXX") → iframe
//  - veya doğrudan .mp4/.webm dosya URL'i (ör. "/extension-demo.mp4") → <video>
// Boşken rehber modalı animasyonlu mock anlatım gösterir (gerçek video hazır olduğunda
// tek satır burayı doldurman yeterli — modal otomatik videoya geçer).
export const EXTENSION_DEMO_VIDEO_URL = "";

// Video URL'i gömme (iframe) mı yoksa <video> mu istediğini ayırt eder.
export function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|loom\.com|vimeo\.com|player\./i.test(url);
}
