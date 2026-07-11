// Background service worker: content script'ten gelen payload'ı Multifolio API'sine
// cookie'li POST'lar (host_permissions sayesinde kullanıcının oturum cookie'leri
// eklenir — spike ile doğrulandı). Başarıda inceleme wizard'ını yeni sekmede açar.
import { IMPORT_ENDPOINT, JOBS_ENDPOINT, WIZARD_URL, LOGIN_URL } from "./config";

interface ImportProject {
  title: string;
  description: string;
  role: string;
  skills: string[];
  images: { url: string; caption: string }[];
}
interface ImportMessage {
  type: "import";
  platform: "upwork" | "fiverr" | "linkedin";
  sourceUrl: string;
  text: string;
  avatarUrl?: string;
  portfolioImages?: string[];
  portfolioProjects?: ImportProject[];
}

// İş yakalama mesajı: /api/jobs'a doğrudan POST (inceleme wizard'ı YOK — job_listings
// satırı oluşur; kullanıcı dashboard'da düzenler/etiketler).
interface CaptureJobMessage {
  type: "capture_job";
  title: string;
  description: string;
  platform?: string;
  company?: string;
  url?: string;
  budget?: string;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "openLogin") {
    void chrome.tabs.create({ url: LOGIN_URL });
    return false;
  }
  if (message?.type === "import") {
    void handleImport(message as ImportMessage).then(sendResponse);
    return true; // async sendResponse
  }
  if (message?.type === "capture_job") {
    void handleCaptureJob(message as CaptureJobMessage).then(sendResponse);
    return true;
  }
  return false;
});

async function handleCaptureJob(msg: CaptureJobMessage) {
  try {
    const res = await fetch(JOBS_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: msg.title,
        description: msg.description,
        ...(msg.platform ? { platform: msg.platform } : {}),
        ...(msg.company ? { company: msg.company } : {}),
        ...(msg.url ? { url: msg.url } : {}),
        ...(msg.budget ? { budget: msg.budget } : {}),
      }),
    });
    if (res.ok) return { ok: true as const };
    if (res.status === 401) return { ok: false as const, reason: "auth" as const };
    if (res.status === 429) return { ok: false as const, reason: "rate" as const };
    const body = await res.json().catch(() => null);
    const message: string | undefined = body?.error?.message;
    return { ok: false as const, reason: "invalid" as const, message };
  } catch {
    return { ok: false as const, reason: "error" as const };
  }
}

async function handleImport(msg: ImportMessage) {
  try {
    const res = await fetch(IMPORT_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "extension",
        platform: msg.platform,
        sourceUrl: msg.sourceUrl,
        text: msg.text,
        ...(msg.avatarUrl ? { avatarUrl: msg.avatarUrl } : {}),
        ...(msg.portfolioImages?.length ? { portfolioImages: msg.portfolioImages } : {}),
        ...(msg.portfolioProjects?.length ? { portfolioProjects: msg.portfolioProjects } : {}),
      }),
    });

    if (res.ok) {
      await chrome.tabs.create({ url: WIZARD_URL });
      return { ok: true as const };
    }
    if (res.status === 401) return { ok: false as const, reason: "auth" as const };
    if (res.status === 429) return { ok: false as const, reason: "rate" as const };

    // Diğer 4xx: sunucunun yerelleştirilmiş mesajını göster (varsa).
    const body = await res.json().catch(() => null);
    const message: string | undefined = body?.error?.message;
    return { ok: false as const, reason: "invalid" as const, message };
  } catch {
    return { ok: false as const, reason: "error" as const };
  }
}
