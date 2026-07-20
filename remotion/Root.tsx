import { Composition } from "remotion";
import { ShowcaseVideo, DEFAULT_COPY } from "./ShowcaseVideo";
import { PALETTES, VIDEO } from "./theme";

/**
 * Remotion kökü — kompozisyonu Studio/CLI'ya kaydeder, böylece landing'in canlı
 * oynattığı AYNI bileşen `npm run video:studio` ile hızlıca tasarlanabilir (ve
 * gerekirse MP4'e export edilebilir: sosyal kart, reklam vb.).
 *
 * Landing bunu import ETMEZ — `ShowcaseVideo`'yu @remotion/player'a doğrudan verir.
 * Studio koyu paleti + varsayılan İngilizce kopyayı kullanır; uygulamada ikisi de
 * prop olarak (tema + i18n) geçilir.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ShowcaseVideo"
        component={ShowcaseVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ palette: PALETTES.dark, copy: DEFAULT_COPY }}
      />
      {/* Mobil (dar ekran) varyantı — landing 640px altında bunu oynatır.
          Ayrı kompozisyon olarak kayıtlı ki Studio/still ile tek başına doğrulanabilsin. */}
      <Composition
        id="ShowcaseVideoCompact"
        component={ShowcaseVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ palette: PALETTES.dark, copy: DEFAULT_COPY, compact: true }}
      />
    </>
  );
}
