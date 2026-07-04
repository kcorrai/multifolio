// Saf IP hash'leme: ham IP saklamak yerine sha256(ip + salt) tutulur.
// Salt seçimi (env fallback dahil) ÇAĞIRANIN sorumluluğu — bu modül saf kalır.
import { createHash } from "node:crypto";

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}
