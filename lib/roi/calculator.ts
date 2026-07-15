// Teklif ROI hesaplayıcı (SEO aracı): "Connect'lerim / kredim geri dönüyor mu?"
// Upwork Connects (veya herhangi bir teklif maliyeti) harcaması ile kazanılan işten
// gelen gelir arasındaki getiriyi gösterir. AI yok, API yok; tamamen istemcide.
// /rate deseni: tüm oranlar VARSAYILAN + kullanıcı düzenleyebilir.

export interface RoiInput {
  /** Gönderilen teklif (bid) sayısı. */
  proposalsSent: number;
  /** Teklif başına harcanan Connect (veya kredi) adedi. */
  connectsPerProposal: number;
  /** Connect başına para maliyeti (ör. Upwork ~$0.15). */
  costPerConnect: number;
  /** Kazanma oranı (0-100): tekliflerin yüzde kaçı işe dönüşüyor. */
  winRatePct: number;
  /** Kazanılan iş başına ortalama gelir. */
  avgProjectValue: number;
}

export interface RoiBreakdown {
  /** Toplam harcanan Connect. */
  connectsSpent: number;
  /** Toplam Connect para maliyeti. */
  totalConnectCost: number;
  /** Kazanılan iş sayısı (kesirli olabilir — projeksiyon). */
  wins: number;
  /** Toplam gelir. */
  revenue: number;
  /** Net kazanç (gelir − Connect maliyeti). */
  netGain: number;
  /** ROI oranı (gelir / Connect maliyeti); ör. 13.9 = 13.9×. */
  roiMultiple: number;
  /** ROI yüzdesi ((gelir − maliyet) / maliyet × 100). */
  roiPct: number;
  /** Kazanç başına harcanan Connect. */
  connectsPerWin: number;
  /** Kazanç başına Connect maliyeti. */
  costPerWin: number;
  /** Harcanan Connect başına gelir. */
  revenuePerConnect: number;
  /** Başabaş kazanma oranı (%): Connect maliyetini karşılamak için gereken min. oran. */
  breakEvenWinRatePct: number;
  /** Hesap anlamlı mı (teklif>0, Connect>0, proje değeri>0). */
  feasible: boolean;
}

/** Upwork Connect başına yaklaşık maliyet (USD, 2026 başı; kullanıcı düzenleyebilir). */
export const DEFAULT_COST_PER_CONNECT = 0.15;

/** Teklif başına Connect ön ayarları (Upwork tipik bid aralığı). */
export const CONNECTS_PER_PROPOSAL_PRESETS = [4, 8, 12, 16] as const;

/** Form varsayılanları. */
export const ROI_DEFAULTS = {
  proposalsSent: 20,
  connectsPerProposal: 12,
  costPerConnect: DEFAULT_COST_PER_CONNECT,
  winRatePct: 5,
  avgProjectValue: 500,
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export function computeRoi(input: RoiInput): RoiBreakdown {
  const proposals = Math.max(0, input.proposalsSent || 0);
  const connectsPer = Math.max(0, input.connectsPerProposal || 0);
  const costPer = Math.max(0, input.costPerConnect || 0);
  const winRate = clampPct(input.winRatePct) / 100;
  const projectValue = Math.max(0, input.avgProjectValue || 0);

  const connectsSpent = round2(proposals * connectsPer);
  const totalConnectCost = round2(connectsSpent * costPer);
  const wins = round2(proposals * winRate);
  const revenue = round2(wins * projectValue);

  const feasible = proposals > 0 && connectsPer > 0 && projectValue > 0;

  if (!feasible) {
    return {
      connectsSpent, totalConnectCost, wins, revenue,
      netGain: round2(revenue - totalConnectCost),
      roiMultiple: 0, roiPct: 0,
      connectsPerWin: 0, costPerWin: 0, revenuePerConnect: 0,
      breakEvenWinRatePct: 0,
      feasible: false,
    };
  }

  const netGain = round2(revenue - totalConnectCost);
  const roiMultiple = totalConnectCost > 0 ? round2(revenue / totalConnectCost) : 0;
  const roiPct = totalConnectCost > 0 ? Math.round((revenue - totalConnectCost) / totalConnectCost * 100) : 0;
  const connectsPerWin = wins > 0 ? round2(connectsSpent / wins) : 0;
  const costPerWin = wins > 0 ? round2(totalConnectCost / wins) : 0;
  const revenuePerConnect = connectsSpent > 0 ? round2(revenue / connectsSpent) : 0;
  // Başabaş: gelir = maliyet olması için gereken kazanma oranı.
  // proposals·rate·projectValue = totalConnectCost → rate = cost / (proposals·projectValue)
  const breakEvenWinRatePct = round2(totalConnectCost / (proposals * projectValue) * 100);

  return {
    connectsSpent, totalConnectCost, wins, revenue, netGain,
    roiMultiple, roiPct, connectsPerWin, costPerWin, revenuePerConnect,
    breakEvenWinRatePct,
    feasible: true,
  };
}
