import { defineConfig } from "vite";
export default defineConfig({
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
