import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const agentApiTarget = process.env.AGENT_DEV_API_TARGET || "https://127.0.0.1:6050";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: agentApiTarget,
        secure: agentApiTarget.startsWith("https:") ? false : undefined,
      },
    },
  },
});
