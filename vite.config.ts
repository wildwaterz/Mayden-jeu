import { defineConfig } from "vite";

// On GitHub Pages the game is served from https://<user>.github.io/Mayden-jeu/,
// so production assets need the repo name as the base path. Local dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Mayden-jeu/" : "/",
  server: {
    host: true,
    port: 5173,
  },
}));
