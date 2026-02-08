import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      three$: path.resolve(__dirname, "./src/three.js"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
  },
});
