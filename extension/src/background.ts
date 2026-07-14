// Background service worker: content script'ten gelen payload'ı Multifolio API'sine
// cookie'li POST'lar (host_permissions sayesinde kullanıcının oturum cookie'leri
// eklenir — spike ile doğrulandı). Başarıda inceleme wizard'ını yeni sekmede açar.
import { IMPORT_ENDPOINT, JOBS_ENDPOINT, PROPOSAL_ENDPOINT, PROPOSAL_LATEST_ENDPOINT, QUICK_MATCH_ENDPOINT, WIZARD_URL, LOGIN_URL } from "./config";

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
  if (message?.type === "fetch_latest_proposal") {
    void handleLatestProposal().then(sendResponse);
    return true;
  }
  if (message?.type === "generate_proposal") {
    void handleGenerateProposal(message as GenerateProposalMessage).then(sendResponse);
    return true;
  }
  if (message?.type === "quick_match") {
    void handleQuickMatch(message as QuickMatchMessage).then(sendResponse);
    return true;
  }
  return false;
});

// Canlı eşleşme skoru: iş ilanı sayfasının başlık+metnini ÜCRETSİZ /api/match/quick'e
// gönderir (deterministik, kredisiz). Sessiz: hata/auth durumunda rozet gösterilmez.
interface QuickMatchMessage {
  type: "quick_match";
  title: string;
  text: string;
}
async function handleQuickMatch(msg: QuickMatchMessage) {
  try {
    const res = await fetch(QUICK_MATCH_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: msg.title, text: msg.text }),
    });
    if (!res.ok) return { ok: false as const };
    const body = await res.json().catch(() => null);
    if (!body || typeof body.score !== "number") return { ok: false as const };
    return { ok: true as const, score: body.score as number, matched: (body.matched ?? []) as string[], missing: (body.missing ?? []) as string[] };
  } catch {
    return { ok: false as const };
  }
}

// Başvuru sayfasında O İŞE ÖZEL teklif üretir: (1) /api/jobs ile işi kaydet (Applied) →
// (2) /api/proposal ile tailored teklif üret. Uzantı içeriği cover-letter kutusuna yazar
// (AUTO-SUBMIT YOK). Yeni backend yok — mevcut iki endpoint zincirlenir.
interface GenerateProposalMessage {
  type: "generate_proposal";
  title: string;
  description: string;
  url?: string;
}

async function handleGenerateProposal(msg: GenerateProposalMessage) {
  try {
    const jobRes = await fetch(JOBS_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: msg.title,
        description: msg.description,
        platform: "upwork",
        ...(msg.url ? { url: msg.url } : {}),
      }),
    });
    if (jobRes.status === 401) return { ok: false as const, reason: "auth" as const };
    if (jobRes.status === 429) return { ok: false as const, reason: "rate" as const };
    if (!jobRes.ok) return { ok: false as const, reason: "error" as const };
    const jobBody = await jobRes.json().catch(() => null);
    const jobId: string | undefined = jobBody?.job?.id;
    if (!jobId) return { ok: false as const, reason: "error" as const };

    const propRes = await fetch(PROPOSAL_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        job_description: msg.description.slice(0, 10000),
        platform: "upwork",
      }),
    });
    if (propRes.status === 401) return { ok: false as const, reason: "auth" as const };
    if (!propRes.ok) {
      // Kredi yetersiz / profil yok gibi durumlar: sunucunun yerelleştirilmiş mesajını taşı.
      const b = await propRes.json().catch(() => null);
      return { ok: false as const, reason: "generate" as const, message: b?.error?.message as string | undefined };
    }
    const propBody = await propRes.json().catch(() => null);
    const content: string | undefined = propBody?.proposal?.content;
    if (!content) return { ok: false as const, reason: "error" as const };
    return { ok: true as const, content };
  } catch {
    return { ok: false as const, reason: "error" as const };
  }
}

// Kullanıcının en son ürettiği teklifi çeker (cover-letter kutusuna yapıştırmak için).
async function handleLatestProposal() {
  try {
    const res = await fetch(PROPOSAL_LATEST_ENDPOINT, { method: "GET", credentials: "include" });
    if (res.status === 401) return { ok: false as const, reason: "auth" as const };
    if (!res.ok) return { ok: false as const, reason: "error" as const };
    const body = await res.json().catch(() => null);
    const content: string | undefined = body?.proposal?.content;
    if (!content) return { ok: false as const, reason: "empty" as const };
    return { ok: true as const, content };
  } catch {
    return { ok: false as const, reason: "error" as const };
  }
}

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
