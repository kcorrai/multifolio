"use client";

/* YEREL GELİŞTİRME ARAÇLARI — üretimde HİÇ render edilmez.
   `process.env.NODE_ENV` derleme zamanı sabittir: prod build'de aşağıdaki dal
   ölü kod olur ve bundle'a girmez (env değişkeni/ayar gerektirmez).

   i18n notu: bu yüzey son kullanıcıya ASLA görünmediği için metinler bilinçli
   olarak katalogda değil — katalog kuralı kullanıcıya görünen metin içindir.

   Amaç: onboarding turunu yerelde tekrar tekrar test edebilmek. Tur ilerleyişi
   cihaz başına localStorage'da tutulduğundan (tour-context), bir kez bitirince
   otomatik başlama bir daha tetiklenmiyordu. */

import { PlayCircle, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTour, TOUR_STORAGE_KEY } from "./tour/tour-context";

const IS_DEV = process.env.NODE_ENV !== "production";

export function DevToolsCard() {
  const { start } = useTour();

  if (!IS_DEV) return null;

  // Turu hemen oynat: profil VARKEN de çalışır (otomatik başlatma koşulunu atlar).
  // Hafızayı sil + yenile: OTOMATİK başlama yolunu test eder (profilsiz kullanıcıda
  // tur kendiliğinden açılmalı) — iki farklı kod yolu, ikisi de test edilebilir olmalı.
  const clearAndReload = () => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {
      /* private-mode: yok say */
    }
    location.reload();
  };

  return (
    <Card className="border-dashed border-amber-500/40 bg-amber-500/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <FlaskConical className="h-4 w-4" />
          Geliştirici araçları
          <span className="ml-auto rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            yalnız yerel
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="text-xs text-muted-foreground">
          Onboarding turunu sıfırdan test et. Bu kart üretim derlemesinde görünmez.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={start}>
            <PlayCircle className="h-3.5 w-3.5" />
            Turu şimdi başlat
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={clearAndReload}>
            <Trash2 className="h-3.5 w-3.5" />
            Tur hafızasını sil + yenile
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/80">
          &ldquo;Sil + yenile&rdquo; otomatik başlatmayı sınar: profili olmayan hesapta tur kendiliğinden açılmalı.
        </p>
      </CardContent>
    </Card>
  );
}
