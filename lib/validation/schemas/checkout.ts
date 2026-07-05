import { z } from "zod";

// Checkout başlatma girdisi — istemci YALNIZ paket kimliğini gönderir; fiyat/kredi
// SUNUCUDA packages.ts'ten çözülür (istemci fiyatına asla güvenilmez).
export const checkoutCreateSchema = z.object({
  packageId: z.enum(["starter", "pro", "scale"]),
});

export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;
