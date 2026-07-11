// Ücret hesaplayıcı (SEO aracı): "Ne ücret istemeliyim?" — saf hesap çekirdeği.
// İstenen NET aylık gelirden geriye doğru: giderler + vergi + platform komisyonu
// telafi edilecek şekilde gereken BRÜT ücret (saatlik/günlük). AI yok, API yok;
// tamamen istemcide çalışır. Oranlar VARSAYILAN + kullanıcı düzenleyebilir.

export interface RateInput {
  /** İstenen net aylık gelir (elde kalan). */
  targetNetMonthly: number;
  /** Aylık işletme gideri (yazılım, ekipman, vergi danışmanı vb.). */
  monthlyExpenses: number;
  /** Haftada gerçekten faturalanabilir saat (idari/pazarlama hariç). */
  billableHoursPerWeek: number;
  /** Yılda çalışılmayan hafta (tatil + hastalık + boşluk). */
  weeksOffPerYear: number;
  /** Basitleştirilmiş vergi oranı (0-100; platform sonrası gelir üzerinden). */
  taxPct: number;
  /** Platform komisyonu (0-100). */
  platformFeePct: number;
}

export interface RateBreakdown {
  /** Yılda çalışılan hafta (52 − izin). */
  workingWeeks: number;
  /** Aylık faturalanabilir saat. */
  monthlyBillableHours: number;
  /** Yıllık faturalanabilir saat. */
  annualBillableHours: number;
  /** Gereken aylık brüt gelir (fatura tutarı, komisyon öncesi). */
  requiredMonthlyGross: number;
  /** Gereken saatlik ücret. */
  requiredHourlyRate: number;
  /** Gereken günlük ücret (8 saat). */
  requiredDayRate: number;
  // Aylık brütün nereye gittiği (dağılım):
  platformFee: number;
  tax: number;
  expenses: number;
  net: number;
  /** Hesap anlamlı mı (saat > 0, komisyon+vergi < %100). */
  feasible: boolean;
}

/** Platform komisyonu varsayılanları (%, 2026 başı; kullanıcı düzenleyebilir).
 *  'direct' = platform yok (doğrudan müşteri) → komisyon 0. */
export const RATE_PLATFORM_DEFAULTS = {
  upwork: 10,
  fiverr: 20,
  bionluk: 20,
  direct: 0,
} as const;

export type RatePlatform = keyof typeof RATE_PLATFORM_DEFAULTS;

/** Faturalanabilir saat ön ayarları (haftalık): part-time → yoğun. */
export const BILLABLE_HOURS_PRESETS = [15, 20, 25, 30, 35] as const;

/** Form varsayılanları. */
export const RATE_DEFAULTS = {
  targetNetMonthly: 3000,
  monthlyExpenses: 300,
  billableHoursPerWeek: 25,
  weeksOffPerYear: 6,
  taxPct: 20,
  platformFeePct: RATE_PLATFORM_DEFAULTS.upwork,
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export function computeSuggestedRate(input: RateInput): RateBreakdown {
  const targetNet = Math.max(0, input.targetNetMonthly || 0);
  const expenses = Math.max(0, input.monthlyExpenses || 0);
  const hoursPerWeek = Math.max(0, input.billableHoursPerWeek || 0);
  const weeksOff = Math.min(51, Math.max(0, input.weeksOffPerYear || 0));
  const tax = clampPct(input.taxPct) / 100;
  const fee = clampPct(input.platformFeePct) / 100;

  const workingWeeks = 52 - weeksOff;
  const annualBillableHours = round2(hoursPerWeek * workingWeeks);
  const monthlyBillableHours = round2(annualBillableHours / 12);

  // Komisyon + vergi birlikte %100'ü yerse (ya da saat 0) hesap anlamsız.
  const feasible = monthlyBillableHours > 0 && fee < 1 && tax < 1 && (1 - fee) * (1 - tax) > 0;

  if (!feasible) {
    return {
      workingWeeks,
      monthlyBillableHours,
      annualBillableHours,
      requiredMonthlyGross: 0,
      requiredHourlyRate: 0,
      requiredDayRate: 0,
      platformFee: 0,
      tax: 0,
      expenses,
      net: targetNet,
      feasible: false,
    };
  }

  // net = brüt·(1−fee)·(1−tax) − gider  →  brüt = (net + gider) / ((1−fee)(1−tax))
  const requiredMonthlyGross = round2((targetNet + expenses) / ((1 - fee) * (1 - tax)));
  const afterPlatform = round2(requiredMonthlyGross * (1 - fee));
  const platformFee = round2(requiredMonthlyGross - afterPlatform);
  const taxAmount = round2(afterPlatform * tax);

  const requiredHourlyRate = round2(requiredMonthlyGross / monthlyBillableHours);
  const requiredDayRate = round2(requiredHourlyRate * 8);

  return {
    workingWeeks,
    monthlyBillableHours,
    annualBillableHours,
    requiredMonthlyGross,
    requiredHourlyRate,
    requiredDayRate,
    platformFee,
    tax: taxAmount,
    expenses,
    net: round2(targetNet),
    feasible: true,
  };
}
