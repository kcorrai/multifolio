// Armut "teklif ver / geç" ROI hesabı (SAF): Armut teklif başına ücret alır (kazansan
// da kaybetsen de, ~₺190 ort.) → her teklif gerçek para riski. Bu hesap "bu lead'e
// teklif vermeye değer mi?"yi beklenen değer + break-even kazanma olasılığıyla yanıtlar.
// TR'de rakipsiz farklılaşma; AI/kredi YOK, tamamen istemcide. En yüksek Armut şikayeti
// "kaybettiğin lead'lere de ödeme" → "daha akıllı teklif ver" konumlandırması.

export interface ArmutRoiInput {
  /** Teklif başına ödenen ücret (₺). */
  leadFee: number;
  /** Kazanırsan ele geçen net proje değeri (₺; komisyon sonrası). */
  projectValue: number;
  /** Bu lead'i kazanma olasılığın (0-100). */
  winProbPct: number;
}

export interface ArmutRoiResult {
  /** Teklif başına beklenen değer = p·değer − ücret (₺, negatif olabilir). */
  expectedValue: number;
  /** Kâr eşiği: bu kazanma olasılığının ÜSTÜNDE teklif kârlı (0-100). */
  breakEvenProbPct: number;
  /** Beklenen değer > 0 mı (teklif vermeye değer mi). */
  worthBidding: boolean;
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));
const round0 = (n: number) => Math.round(n);

export function computeArmutRoi(input: ArmutRoiInput): ArmutRoiResult {
  const leadFee = Math.max(0, input.leadFee || 0);
  const projectValue = Math.max(0, input.projectValue || 0);
  const p = clampPct(input.winProbPct || 0) / 100;

  const expectedValue = round0(p * projectValue - leadFee);
  // p·value = leadFee → p = leadFee/value. Değer 0 ise asla kâr etmez (%100 eşiği).
  const breakEvenProbPct = projectValue > 0 ? Math.min(100, round0((leadFee / projectValue) * 100)) : 100;

  return {
    expectedValue,
    breakEvenProbPct,
    worthBidding: expectedValue > 0,
  };
}
