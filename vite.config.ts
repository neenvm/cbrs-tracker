import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/polymarket-gamma": {
        target: "https://gamma-api.polymarket.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/polymarket-gamma/, "")
      },
      "/polymarket-clob": {
        target: "https://clob.polymarket.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/polymarket-clob/, "")
      },
      "/hyperliquid-info": {
        target: "https://api.hyperliquid.xyz",
        changeOrigin: true,
        rewrite: () => "/info"
      }
    }
  }
});

