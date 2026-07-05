// iyzico REST istemcisi — YALNIZ SUNUCU (secret .env'de). Checkout Form akışı:
// initialize → kullanıcı hosted ödeme sayfasına gider → iyzico callbackUrl'e token POST'lar
// → retrieve ile sonucu SUNUCUDAN doğrula. İmzalama lib/payments/iyzico-sign (saf).
import "server-only";
import { iyziAuthorizationHeader, makeRandomKey } from "./iyzico-sign";

// Sandbox varsayılan; prod'da IYZICO_BASE_URL="https://api.iyzipay.com".
const DEFAULT_BASE_URL = "https://sandbox-api.iyzipay.com";

const INITIALIZE_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const RETRIEVE_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function iyziConfig() {
  return {
    apiKey: process.env.IYZICO_API_KEY ?? "",
    secretKey: process.env.IYZICO_SECRET_KEY ?? "",
    baseUrl: process.env.IYZICO_BASE_URL || DEFAULT_BASE_URL,
  };
}

// Anahtarlar tanımlı mı? (checkout route bu false ise 503 döner — sessiz patlamaz.)
export function isIyzicoConfigured(): boolean {
  const { apiKey, secretKey } = iyziConfig();
  return Boolean(apiKey && secretKey);
}

export interface IyziBuyer {
  id: string;
  name: string;
  surname: string;
  gsmNumber?: string;
  email: string;
  identityNumber: string; // iyzico zorunlu; TCKN yoksa yer tutucu
  registrationAddress: string;
  ip: string;
  city: string;
  country: string;
  zipCode?: string;
}

export interface IyziAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface IyziBasketItem {
  id: string;
  name: string;
  category1: string;
  itemType: "PHYSICAL" | "VIRTUAL";
  price: string; // basketItems price toplamı = price ile eşleşmeli
}

export interface InitializeCheckoutFormRequest {
  locale: "tr" | "en";
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: "TRY" | "USD" | "EUR" | "GBP";
  basketId: string;
  paymentGroup: "PRODUCT" | "LISTING" | "SUBSCRIPTION";
  callbackUrl: string;
  buyer: IyziBuyer;
  shippingAddress: IyziAddress;
  billingAddress: IyziAddress;
  basketItems: IyziBasketItem[];
}

export interface CheckoutInitResult {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
}

export interface CheckoutRetrieveResult {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string; // "SUCCESS" | "FAILURE" | "INIT_THREEDS" ...
  fraudStatus?: number; // 1 = onaylı, 0 = incelemede, -1 = ret
  token?: string;
  price?: string;
  paidPrice?: string;
  currency?: string;
  basketId?: string;
  conversationId?: string;
  paymentId?: string;
}

async function iyziPost<T>(uriPath: string, body: unknown): Promise<T> {
  const { apiKey, secretKey, baseUrl } = iyziConfig();
  // İMZA ile GÖVDE aynı string olmalı → bir kez stringify et.
  const requestBody = JSON.stringify(body);
  const randomKey = makeRandomKey(Date.now(), Math.random());
  const authorization = iyziAuthorizationHeader({ apiKey, secretKey, randomKey, uriPath, requestBody });

  const res = await fetch(baseUrl + uriPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
    },
    body: requestBody,
    // Ödeme uçları cache'lenmemeli.
    cache: "no-store",
  });

  // iyzico hata durumunda da 200 + {status:"failure"} döner; HTTP hatası ayrı ele alınır.
  if (!res.ok) {
    throw new Error(`iyzico HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function initializeCheckoutForm(req: InitializeCheckoutFormRequest): Promise<CheckoutInitResult> {
  return iyziPost<CheckoutInitResult>(INITIALIZE_PATH, req);
}

export function retrieveCheckoutForm(params: {
  token: string;
  conversationId?: string;
  locale?: "tr" | "en";
}): Promise<CheckoutRetrieveResult> {
  return iyziPost<CheckoutRetrieveResult>(RETRIEVE_PATH, {
    locale: params.locale ?? "tr",
    conversationId: params.conversationId,
    token: params.token,
  });
}

// Ödeme gerçekten TAMAMLANDI mı? status=success + paymentStatus=SUCCESS + fraudStatus=1.
// fraudStatus=0 (incelemede) → henüz kredi verme (nadir; elle ele alınır).
export function isPaymentSuccessful(r: CheckoutRetrieveResult): boolean {
  return r.status === "success" && r.paymentStatus === "SUCCESS" && r.fraudStatus === 1;
}
