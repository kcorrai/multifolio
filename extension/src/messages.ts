// Uzantı UI metinleri: chrome.i18n (_locales/{en,tr}) üzerinden, tarayıcı diline göre.
// FALLBACK = EN — chrome.i18n erişilemezse (ör. birim test bağlamı) devreye girer.
const FALLBACK = {
  button: "Import to Multifolio",
  sending: "Importing…",
  success: "Draft ready — review it in the Multifolio tab.",
  authNeeded: "Log in to Multifolio first — click to open.",
  rateLimited: "Import limit reached — try again in an hour.",
  emptyPage: "Couldn't read enough profile text on this page.",
  genericError: "Import failed — try again.",
  openLogin: "Open login",
  captureJob: "Save job to Multifolio",
  matchScore: "Match",
  captureSending: "Saving…",
  captureSuccess: "Job saved — find it in Multifolio › Jobs.",
  captureEmpty: "Couldn't read the job title/description on this page.",
  generateFill: "Generate & fill proposal",
  generating: "Generating…",
  pasteProposal: "Insert my latest proposal",
  pasteSending: "Fetching…",
  pasteSuccess: "Proposal inserted — review and submit yourself.",
  pasteNoProposal: "No proposal yet — generate one in Multifolio first.",
  pasteNoBox: "Couldn't find a cover-letter box — click into it first.",
} as const;

export type MsgKey = keyof typeof FALLBACK;

export function msg(key: MsgKey): string {
  try {
    return chrome.i18n.getMessage(key) || FALLBACK[key];
  } catch {
    return FALLBACK[key];
  }
}
