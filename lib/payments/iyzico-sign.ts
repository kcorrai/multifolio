// iyzico IYZWSv2 kimlik doğrulama imzası — SAF (test edilebilir, I/O yok).
// Algoritma (resmi HMACSHA256 dokümanı):
//   payload   = randomKey + uriPath + requestBody      (sıra önemli; uriPath yalnız yol)
//   signature = HMAC_SHA256(payload, secretKey) → hex (küçük harf)
//   authStr   = "apiKey:{apiKey}&randomKey:{randomKey}&signature:{signature}"
//   header    = "IYZWSv2 " + base64(authStr)
// İstek ayrıca "x-iyzi-rnd: {randomKey}" header'ı taşır.
// DİKKAT: requestBody, gövdeye yazılan JSON string ile BİREBİR aynı olmalı (bir kez stringify).
import { createHmac } from "crypto";

export function iyziSignature(
  secretKey: string,
  randomKey: string,
  uriPath: string,
  requestBody: string,
): string {
  const payload = randomKey + uriPath + requestBody;
  return createHmac("sha256", secretKey).update(payload, "utf8").digest("hex");
}

export function iyziAuthorizationHeader(params: {
  apiKey: string;
  secretKey: string;
  randomKey: string;
  uriPath: string;
  requestBody: string;
}): string {
  const signature = iyziSignature(params.secretKey, params.randomKey, params.uriPath, params.requestBody);
  const authString = `apiKey:${params.apiKey}&randomKey:${params.randomKey}&signature:${signature}`;
  const base64 = Buffer.from(authString, "utf8").toString("base64");
  return `IYZWSv2 ${base64}`;
}

// İstek başına benzersiz rastgele anahtar. iyzico örneği: zaman damgası + rakamlar.
// now/rand enjekte edilir → saf/test edilebilir (çağıran Date.now()/Math.random() geçer).
export function makeRandomKey(now: number, rand: number): string {
  const suffix = Math.floor(rand * 1e9)
    .toString()
    .padStart(9, "0");
  return `${now}${suffix}`;
}
