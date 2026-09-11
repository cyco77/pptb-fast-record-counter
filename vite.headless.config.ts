import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/mcp/headless.ts",
      formats: ["es"],
      fileName: () => "headless.js",
    },
  },
});
