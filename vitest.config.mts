import { defineConfig } from "vitest/config";
import path from "path";

const rootDir = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "server-only": path.resolve(rootDir, "./vitest.server-only-stub.ts"),
    },
  },
  test: {
    env: {
      // Las pruebas de src/lib/auth.ts firman/verifican tokens — necesitan un
      // secreto, aunque no sea el real de ningún entorno.
      SESSION_SECRET: "test-only-secret-never-used-outside-vitest",
    },
  },
});
