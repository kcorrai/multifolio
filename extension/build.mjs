// esbuild paketleyici: src/{background,content}.ts → dist/ (iife).
// --dev: API tabanı localhost'a döner. dist/ tam yüklenebilir uzantıdır
// (manifest + ikonlar kopyalanır) — chrome://extensions → "Load unpacked" → dist.
import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

const dev = process.argv.includes("--dev");
const apiBase = dev ? "http://localhost:3000" : "https://multifolio-ecru.vercel.app";

mkdirSync("dist", { recursive: true });
cpSync("manifest.json", "dist/manifest.json");
cpSync("icons", "dist/icons", { recursive: true });

await build({
  entryPoints: ["src/background.ts", "src/content.ts"],
  bundle: true,
  format: "iife",
  outdir: "dist",
  target: "chrome120",
  define: { __API_BASE__: JSON.stringify(apiBase) },
  logLevel: "info",
});

console.log(`built (${dev ? "dev" : "prod"}) → API_BASE=${apiBase}`);
