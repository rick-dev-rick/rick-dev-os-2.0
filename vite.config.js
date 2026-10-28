import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/rick-dev-os-2.0/" : "/",
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
