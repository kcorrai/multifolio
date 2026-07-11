// Net kazanç hesaplayıcı (Dalga 3 / Tier 2 #9): saf hesap çekirdeği.
// "Elime net ne geçer?" — brüt → platform komisyonu → transfer kesintisi →
// (basitleştirilmiş) vergi → net. AI yok, API yok; tamamen istemcide çalışır.
// Oranlar VARSAYILAN + kullanıcı tarafından düzenlenebilir (oranlar değişebilir;
// UI'da güncellik uyarısı gösterilir).

export interface EarningsInput {
  /** Brüt tutar (platform para biriminde). */
  gross: number;
  /** Platform komisyonu (0-100). */
  platformFeePct: number;
  /** Transfer kesintisi yüzdesi (0-100). */
  transferFeePct: number;
  /** Transfer sabit ücreti (aynı para biriminde). */
  transferFeeFixed: number;
  /** Basitleştirilmiş vergi oranı (0-100; transfer sonrası kalan üzerinden). */
  taxPct: number;
  /** Döviz kuru (ör. USD→TRY). Girilirse net'in TL karşılığı hesaplanır. */
  fxRate?: number | null;
}

export interface EarningsBreakdown {
  gross: number;
  platformFee: number;
  afterPlatform: number;
  transferFee: number;
  afterTransfer: number;
  tax: number;
  net: number;
  /** fxRate verildiyse net × kur; yoksa null. */
  netConverted: number | null;
  /** Net / brüt (0-100; brüt 0 ise 0). */
  netPct: number;
}

/** Platform komisyonu varsayılanları (%, 2026 başı; kullanıcı düzenleyebilir).
 *  Armut yok: komisyon değil ilan başına teklif ücreti modeli — 'custom' kullanılır. */
export const PLATFORM_FEE_DEFAULTS = {
  upwork: 10,
  fiverr: 20,
  bionluk: 20,
  custom: 0,
} as const;

export type EarningsPlatform = keyof typeof PLATFORM_FEE_DEFAULTS;

/** Transfer yöntemi varsayılanları (yüzde + sabit; kullanıcı düzenleyebilir). */
export const TRANSFER_METHOD_DEFAULTS = {
  payoneer: { pct: 2, fixed: 0 },
  wise: { pct: 1, fixed: 0 },
  bank: { pct: 0, fixed: 15 },
  none: { pct: 0, fixed: 0 },
} as const;

export type TransferMethod = keyof typeof TRANSFER_METHOD_DEFAULTS;

/** Hızlı vergi ön ayarları (%): yok / genç girişimci istisnası kabaca / gelir vergisi ilk dilimleri. */
export const TAX_PRESETS = [0, 15, 20, 27] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export interface PlatformNetRow {
  platform: Exclude<EarningsPlatform, "custom">;
  platformFeePct: number;
  net: number;
  netPct: number;
}

/** Aynı brüt + transfer + vergi altında komisyon alan platformların (upwork/fiverr/
 *  bionluk) net karşılaştırması: yalnız platform komisyonu değişir → sıralama komisyon
 *  farkını yansıtır. 'custom' (kullanıcı tanımlı) matrise girmez. Net'e göre azalan sıralı. */
export function compareNetByPlatform(input: EarningsInput): PlatformNetRow[] {
  const platforms = (Object.keys(PLATFORM_FEE_DEFAULTS) as EarningsPlatform[]).filter(
    (p): p is Exclude<EarningsPlatform, "custom"> => p !== "custom",
  );
  return platforms
    .map((platform) => {
      const platformFeePct = PLATFORM_FEE_DEFAULTS[platform];
      const b = computeNetEarnings({ ...input, platformFeePct });
      return { platform, platformFeePct, net: b.net, netPct: b.netPct };
    })
    .sort((a, b) => b.net - a.net);
}

export function computeNetEarnings(input: EarningsInput): EarningsBreakdown {
  const gross = Math.max(0, input.gross || 0);
  const platformFee = round2(gross * (clampPct(input.platformFeePct) / 100));
  const afterPlatform = round2(gross - platformFee);

  const transferFee = round2(
    Math.min(afterPlatform, afterPlatform * (clampPct(input.transferFeePct) / 100) + Math.max(0, input.transferFeeFixed || 0)),
  );
  const afterTransfer = round2(afterPlatform - transferFee);

  const tax = round2(afterTransfer * (clampPct(input.taxPct) / 100));
  const net = round2(afterTransfer - tax);

  const fx = input.fxRate && input.fxRate > 0 ? input.fxRate : null;

  return {
    gross: round2(gross),
    platformFee,
    afterPlatform,
    transferFee,
    afterTransfer,
    tax,
    net,
    netConverted: fx ? round2(net * fx) : null,
    netPct: gross > 0 ? round2((net / gross) * 100) : 0,
  };
}
