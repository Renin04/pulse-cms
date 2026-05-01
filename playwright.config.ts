import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const DEFAULT_WINDOWS_CHROMIUM =
  "/mnt/c/Users/z0512/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe";

const candidateExecutables = [
  process.env.PULSE_CHROMIUM_EXECUTABLE,
  DEFAULT_WINDOWS_CHROMIUM,
].filter((value): value is string => Boolean(value));

const resolvedExecutable = candidateExecutables.find((path) => existsSync(path));
const hasLocalBrowser = Boolean(resolvedExecutable);
process.env.PULSE_E2E_BROWSER_READY = hasLocalBrowser ? "1" : "0";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath: resolvedExecutable,
          args: ["--no-sandbox", "--disable-gpu", "--headless=new"],
        },
      },
    },
  ],
});
