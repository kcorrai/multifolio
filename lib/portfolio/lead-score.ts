// SAF lead nitelendirme (AI/kredi YOK, test'li). Public portfolyo "işe al" formundan
// gelen talepleri (portfolio_leads) kural-tabanlı puanlar → owner en umut verici
// talebe önce baksın. Sinyaller: bütçe varlığı/büyüklüğü, mesaj detayı, proje türü,
// zaman çizelgesi. UI: components/dashboard/leads-manager.tsx.
import type { LeadRow } from "@/lib/validation/schemas/lead";

export type LeadTier = "hot" | "good" | "cold";

export interface LeadScore {
  tier: LeadTier;
  // i18n anahtar SLUG'ları (UI çevirir) — puana katkı veren sinyaller.
  reasons: string[];
}

// Bütçe metninden ilk sayı (lib/feed/filter extractBudgetFloor mantığı).
function budgetFloor(text: string | null): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function scoreLead(lead: LeadRow): LeadScore {
  let points = 0;
  const reasons: string[] = [];

  const floor = budgetFloor(lead.budget);
  if (floor !== null && floor >= 500) {
    points += 2;
    reasons.push("solidBudget");
  } else if (lead.budget && lead.budget.trim()) {
    points += 1;
    reasons.push("hasBudget");
  }

  const msgLen = lead.message.trim().length;
  if (msgLen >= 300) {
    points += 2;
    reasons.push("detailedMessage");
  } else if (msgLen >= 120) {
    points += 1;
  }

  if (lead.project_type && lead.project_type.trim()) {
    points += 1;
    reasons.push("hasProjectType");
  }
  if (lead.timeline && lead.timeline.trim()) {
    points += 1;
    reasons.push("hasTimeline");
  }

  const tier: LeadTier = points >= 4 ? "hot" : points >= 2 ? "good" : "cold";
  return { tier, reasons };
}

// Sıralama için tier rütbesi (hot önce).
export const LEAD_TIER_RANK: Record<LeadTier, number> = { hot: 0, good: 1, cold: 2 };
