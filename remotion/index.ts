// Remotion Studio/CLI giriş noktası (yalnız `npm run video:studio` kullanır).
// Next.js bundle'ı bu dosyayı ASLA import etmez.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
