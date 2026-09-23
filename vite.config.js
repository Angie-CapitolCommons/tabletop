import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ports deliberately avoid 3000/3001/3010/3110/3210 (in use by other local projects).
export default defineConfig({
  root: "client",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 4700,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4600",
        changeOrigin: true,
      },
    },
  },
});
