import { getRequestConfig } from "next-intl/server";

// Global-only: tek katalog (İngilizce).
export default getRequestConfig(async () => ({
  locale: "en",
  messages: (await import("../messages/en.json")).default,
}));
