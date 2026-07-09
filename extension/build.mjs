// esbuild paketleyici: src/{background,content}.ts → dist/ (iife).
// --dev: API tabanı localhost'a döner ve manifest localhost iznini korur.
// Prod build'de localhost host_permission manifest'ten ÇIKARILIR (store paketi temiz).
// dist/ tam yüklenebilir uzantıdır — chrome://extensions → "Load unpacked" → dist.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const dev = process.argv.includes("--dev");
const apiBase = dev ? "http://localhost:3000" : "https://multifolio-ecru.vercel.app";

mkdirSync("dist", { recursive: true });

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
if (!dev) {
  manifest.host_permissions = manifest.host_permissions.filter(
    (p) => !p.includes("localhost"),
  );
}
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));

cpSync("icons", "dist/icons", { recursive: true });
cpSync("_locales", "dist/_locales", { recursive: true });

await build({
  entryPoints: ["src/background.ts", "src/content.ts", "src/nuxt.ts", "src/fiverr.ts"],
  bundle: true,
  format: "iife",
  outdir: "dist",
  target: "chrome120",
  define: { __API_BASE__: JSON.stringify(apiBase) },
  logLevel: "info",
});

console.log(`built (${dev ? "dev" : "prod"}) → API_BASE=${apiBase}`);
