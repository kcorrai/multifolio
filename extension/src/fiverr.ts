// MAIN-world content script (Fiverr). İzole content.ts sayfanın JS global'i
// window.__PERSEUS__initialProps'a ERİŞEMEZ. Bu script MAIN dünyada çalışıp o global'i
// (JSON string) okur, saf mapFiverrProps ile yapılandırılmış profile çevirir ve
// content.ts'in "mf-get-fiverr" isteğine "mf-fiverr" (JSON) ile yanıt verir.
//
// Fiverr Upwork gibi sayfalama gerektirmez: tüm veri (profil + gig'ler + görseller)
// ilk yüklemede initialProps'ta gelir. Bu yüzden fetch/XHR hook YOK — tek okuma yeter.
import { mapFiverrProps } from "./fiverr-map";

// window.__PERSEUS__initialProps string ise parse et; obje ise doğrudan kullan.
function readPerseusProps(): unknown {
  try {
    const w = window as unknown as { __PERSEUS__initialProps?: unknown };
    const raw = w.__PERSEUS__initialProps;
    if (typeof raw === "string") return JSON.parse(raw);
    return raw ?? null;
  } catch {
    return null;
  }
}

document.addEventListener("mf-get-fiverr", () => {
  let payload = "null";
  try {
    const extract = mapFiverrProps(readPerseusProps());
    payload = JSON.stringify(extract);
  } catch {
    payload = "null";
  }
  document.dispatchEvent(new CustomEvent("mf-fiverr", { detail: payload }));
});
