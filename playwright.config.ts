import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://127.0.0.1:4400" },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4400 --strictPort",
    url: "http://127.0.0.1:4400",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
