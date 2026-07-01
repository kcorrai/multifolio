// Saf yardımcılar — teklif kapsama (coverage) mantığı. server-only DEĞİL; test edilebilir.
import type { ProposalCoverageItem } from "@/lib/validation/schemas/proposal";

// "met" olmayan (missing/partial) gereksinimlerin metinleri — "Eksikleri Gider" için.
export function pendingRequirements(coverage: ProposalCoverageItem[]): string[] {
  return coverage.filter((c) => c.status !== "met").map((c) => c.requirement);
}

// Kapsama özeti: karşılanan / toplam.
export function coverageSummary(
  coverage: ProposalCoverageItem[],
): { met: number; total: number } {
  return {
    met: coverage.filter((c) => c.status === "met").length,
    total: coverage.length,
  };
}

// Prompt bloğu: verilen gereksinimleri listeler (boşsa "").
export function buildRequirementsBlock(requirements?: string[]): string {
  if (!requirements?.length) return "";
  return [
    "",
    "İlan Gereksinimleri (bunları karşıla ve her birini değerlendir):",
    ...requirements.map((r) => `- ${r}`),
  ].join("\n");
}

// Prompt bloğu: özellikle vurgulanacak eksik/kısmi gereksinimler (boşsa "").
export function buildFocusBlock(focus?: string[]): string {
  if (!focus?.length) return "";
  return [
    "",
    "ÖZELLİKLE şu eksik/kısmi gereksinimleri bu sefer açıkça karşıla:",
    ...focus.map((r) => `- ${r}`),
  ].join("\n");
}
