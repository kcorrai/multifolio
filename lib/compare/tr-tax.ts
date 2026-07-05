// TR serbest çalışan vergi avantajı BİLGİ modülü (SAF): yurt dışı müşteriye hizmet
// veren Türk freelancer'ların iki büyük avantajını (GVK 89/1-13 hizmet ihracı indirimi +
// GVK mük.20 genç girişimci istisnası) uygunluk + KABA matrah indirimi tahminiyle gösterir.
// AI/API/kredi YOK, tamamen istemcide. UI güçlü "mali müşavire danış" uyarısı + GİB linki
// gösterir; bu bir vergi danışmanlığı DEĞİLDİR. Rakamlar yürürlük yılıyla verilir.
//
// Kaynak (2026-07-05 araştırması): 89/13 oranı 7491 s.K. ile 2023-2025 için %80, 11257 s.
// CBK (RG 30.04.2026) ile 2026+ için %100. Genç girişimci tavanı 2025: 330.000₺, 2026: 400.000₺.
// Her rakam yıllık değişir — UI kaynağa yönlendirir.

export interface TrTaxRates {
  year: number;
  /** GVK 89/1-13 yurt dışı hizmet kazanç indirimi oranı (matrahtan indirim). */
  hizmetIhraciPct: number;
  /** GVK mük.20 genç girişimci yıllık istisna tavanı (TRY). */
  gencGirisimciCap: number;
}

export const TR_TAX_RATES: Record<number, TrTaxRates> = {
  2025: { year: 2025, hizmetIhraciPct: 80, gencGirisimciCap: 330_000 },
  2026: { year: 2026, hizmetIhraciPct: 100, gencGirisimciCap: 400_000 },
};

export const TR_TAX_YEARS = [2026, 2025] as const;
export const TR_TAX_YEAR_DEFAULT = 2026;

export interface TrTaxAnswers {
  /** Yurt dışında yerleşik müşteriye mi hizmet veriyorsun? */
  foreignClients: boolean;
  /** Hizmetin kapsamda mı (yazılım/tasarım/mühendislik/mimarlık/veri işleme vb.)? */
  professionInScope: boolean;
  /** TR'den fatura + kazancı beyanname tarihine kadar TR'ye getiriyor musun? */
  invoicesFromTurkey: boolean;
  /** 29 yaş altı + ilk kez gelir vergisi mükellefi misin? */
  youngFirstTime: boolean;
}

export type Eligibility = "likely" | "no";

export interface TrTaxResult {
  hizmetIhraci: Eligibility;
  gencGirisimci: Eligibility;
}

/**
 * Uygunluk değerlendirmesi (kesin hüküm değil — "likely"/"no" sinyali).
 * 89/13: üç şart birlikte. Genç girişimci: yaş + ilk kez mükellefiyet.
 */
export function assessTrTax(a: TrTaxAnswers): TrTaxResult {
  return {
    hizmetIhraci: a.foreignClients && a.professionInScope && a.invoicesFromTurkey ? "likely" : "no",
    gencGirisimci: a.youngFirstTime ? "likely" : "no",
  };
}

const round0 = (n: number) => Math.round(n);

export interface TrTaxEstimate {
  income: number;
  /** Genç girişimci istisnası (kazancın tavana kadar kısmı). */
  gencGirisimciExempt: number;
  afterGenc: number;
  /** 89/13 indirimi (genç girişimci SONRASI kalan kazanç üzerinden). */
  hizmetIhraciDeduction: number;
  /** Kalan (kabaca) vergiye tabi matrah — final vergi DEĞİL. */
  remainingBase: number;
  /** Toplam vergiden korunan matrah / kazanç (0-100). */
  shieldedPct: number;
}

/**
 * KABA matrah indirimi tahmini (BİLGİLENDİRME — ödenecek vergi DEĞİL; gelir vergisi
 * dilimleri, giderler, SGK vb. dahil değil). Sıra araştırmayla uyumlu: önce genç
 * girişimci istisnası, sonra kalan üzerinden 89/13 indirimi.
 */
export function estimateTrTaxBase(annualIncome: number, rates: TrTaxRates, res: TrTaxResult): TrTaxEstimate {
  const income = Math.max(0, annualIncome || 0);
  const gencGirisimciExempt = res.gencGirisimci === "likely" ? Math.min(income, rates.gencGirisimciCap) : 0;
  const afterGenc = income - gencGirisimciExempt;
  const hizmetIhraciDeduction = res.hizmetIhraci === "likely" ? round0((afterGenc * rates.hizmetIhraciPct) / 100) : 0;
  const remainingBase = round0(afterGenc - hizmetIhraciDeduction);
  const shielded = income - remainingBase;
  return {
    income,
    gencGirisimciExempt,
    afterGenc,
    hizmetIhraciDeduction,
    remainingBase,
    shieldedPct: income > 0 ? round0((shielded / income) * 100) : 0,
  };
}
