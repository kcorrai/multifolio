import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // extension/ kendi vitest'iyle koşar (chrome tipleri + ayrı tsconfig).
  test: { environment: "node", exclude: [...configDefaults.exclude, "extension/**"] },
});
