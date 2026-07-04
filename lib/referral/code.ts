// Saf davet kodu üretimi: 8 karakter, okuma/yazmada karışan karakterler
// (0/O, 1/I/L) alfabede yok. Benzersizlik DB unique kısıtıyla garanti edilir;
// çakışmada çağıran yeniden üretir.
import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_LENGTH = 8;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
