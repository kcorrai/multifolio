"use client";

/* Asıl @remotion/player mount'u — YALNIZ istemcide (showcase-video.tsx içinden
   next/dynamic ssr:false ile yüklenir), böylece landing statik prerender kalır.

   Oynatma sözleşmesi (ürün kararı): SESSİZ, KONTROLSÜZ, sonsuz döngü. Ses olmadığı
   için tarayıcı autoplay politikası engellemez; yine de `mute()` çağrılır (bazı
   motorlar sessiz medyada bile programatik play()'i kısıtlar).
   IntersectionObserver ekranda değilken duraklatır → boşuna CPU/pil yakmaz.
   `prefers-reduced-motion: reduce` → hiç oynatmaz, temsili tek kare gösterir. */

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { ShowcaseVideo, type ShowcaseCopy } from "@/remotion/ShowcaseVideo";
import { VIDEO, type Palette } from "@/remotion/theme";

/** Hareket azaltma tercihinde donduralacak temsili kare (feed sahnesi, dolu görünür). */
const STILL_FRAME = 200;

export default function ShowcaseVideoPlayer({ palette, copy }: { palette: Palette; copy: ShowcaseCopy }) {
  const ref = useRef<PlayerRef>(null);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      player.pause();
      player.seekTo(STILL_FRAME);
      return;
    }

    const play = () => {
      player.mute();
      // play() autoplay politikası altında reddedilebilir — yut; IO tekrar dener.
      Promise.resolve(player.play()).catch(() => {});
    };
    play();

    const el = player.getContainerNode?.();
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) play();
          else player.pause();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Player
      ref={ref}
      component={ShowcaseVideo}
      inputProps={{ palette, copy }}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      compositionWidth={VIDEO.width}
      compositionHeight={VIDEO.height}
      style={{ width: "100%", height: "100%" }}
      autoPlay
      initiallyMuted
      loop
    />
  );
}
