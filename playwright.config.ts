import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4400" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4400 --strictPort",
    url: "http://localhost:4400",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
