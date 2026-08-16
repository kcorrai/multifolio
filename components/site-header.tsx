// Paylaşılan üst gezinme (pricing, rehberler, pSEO, yasal sayfalar).
// Solar Pop kabuğuna devredildi — marka/nav/auth tek yerde (solar/site-chrome),
// böylece landing ve araç sayfalarıyla AYNI başlık kullanılır.
import { SolarHeader, HeaderAuth } from "@/components/solar/site-chrome";
import { LandingNavLinks, LandingMobileNav } from "@/components/solar/landing-nav";

export async function SiteHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <SolarHeader
      nav={<LandingNavLinks />}
      actions={
        <div className="flex items-center gap-3">
          <span className="sp-toolnav flex items-center">
            <HeaderAuth isLoggedIn={isLoggedIn} />
          </span>
          <LandingMobileNav isLoggedIn={isLoggedIn} />
        </div>
      }
    />
  );
}
