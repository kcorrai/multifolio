// Çok-platform net gelir karşılaştırıcı (SAF): aynı proje tutarı için 5 platformda
// "elime net ne geçer?"i yan yana koyar. /earnings çekirdeğini (computeNetEarnings)
// yeniden kullanır — transfer + vergi tüm platformlarda AYNI uygulanır, böylece fark
// yalnız platform komisyonundan gelir. AI/API/kredi YOK, tamamen istemcide.
//
// Armut BİLEREK dışarıda: yüzde komisyon değil, teklif-başı ücret modeli
// (kazansan da kaybetsen de ödenir) → yüzdeyle kıyaslamak yanıltıcı olur. UI ayrı
// bir bilgi kartıyla açıklar (bkz. components/compare/platform-compare.tsx).
import { computeNetEarnings } from "@/lib/earnings/calculator";

export type ComparePlatform = "direct" | "upwork" | "fiverr" | "bionluk";

// Platform komisyonu (%, 2026 başı; PLATFORM_FEE_DEFAULTS ile hizalı).
// "direct" = doğrudan müşteri (LinkedIn/kendi ağın): pazaryeri komisyonu yok.
export const COMPARE_FEES: Record<ComparePlatform, number> = {
  direct: 0,
  upwork: 10,
  fiverr: 20,
  bionluk: 20,
};

export const COMPARE_PLATFORM_ORDER: ComparePlatform[] = ["direct", "upwork", "fiverr", "bionluk"];

export interface CompareRow {
  platform: ComparePlatform;
  feePct: number;
  /** Ele geçen net (transfer + vergi sonrası). */
  net: number;
  /** Net / brüt (0-100). */
  netPct: number;
}

export interface CompareInput {
  gross: number;
  transferFeePct: number;
  transferFeeFixed: number;
  taxPct: number;
}

/**
 * Verilen tutar için tüm platformların netini hesaplayıp net DESC sıralar
 * (en çok ele geçen üstte). Transfer + vergi her platforma eşit uygulanır.
 */
export function comparePlatforms(input: CompareInput): CompareRow[] {
  return COMPARE_PLATFORM_ORDER.map((platform) => {
    const b = computeNetEarnings({
      gross: input.gross,
      platformFeePct: COMPARE_FEES[platform],
      transferFeePct: input.transferFeePct,
      transferFeeFixed: input.transferFeeFixed,
      taxPct: input.taxPct,
    });
    return { platform, feePct: COMPARE_FEES[platform], net: b.net, netPct: b.netPct };
  }).sort((a, b) => b.net - a.net);
}
