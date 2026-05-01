import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import { expect, test } from "@playwright/test";

const WEBSITE_DIST_DIR = resolve(process.cwd(), "apps/website/dist");

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveStaticPath(urlPathname: string) {
  const normalizedPath = decodeURIComponent(urlPathname.split("?")[0] || "/");
  const trimmedPath = normalizedPath.replace(/^\/+/, "");

  if (!trimmedPath) {
    return join(WEBSITE_DIST_DIR, "index.html");
  }

  const directPath = join(WEBSITE_DIST_DIR, trimmedPath);
  if (existsSync(directPath)) {
    const stats = statSync(directPath);
    return stats.isDirectory() ? join(directPath, "index.html") : directPath;
  }

  return join(WEBSITE_DIST_DIR, trimmedPath, "index.html");
}

function sendFile(response: ServerResponse, filePath: string) {
  if (!existsSync(filePath)) {
    response.statusCode = 404;
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] ?? "application/octet-stream";
  response.statusCode = 200;
  response.setHeader("content-type", type);
  response.end(readFileSync(filePath));
}

async function withWebsiteServer(
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const filePath = resolveStaticPath(request.url ?? "/");
    sendFile(response, filePath);
  });

  await new Promise<void>((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to start website server");
  }

  const url = `http://127.0.0.1:${address.port}`;

  try {
    await run(url);
  } finally {
    await new Promise<void>((resolveClose) => {
      server.close(() => resolveClose());
    });
  }
}

test.describe("Pulse website", () => {
  test.skip(
    process.env.PULSE_E2E_BROWSER_READY !== "1",
    "No local cached browser runtime is available for E2E execution",
  );

  test("renders core marketing pages and nested content routes", async ({ page }) => {
    await withWebsiteServer(async (url) => {
      await page.goto(url);

      await expect(
        page.getByRole("heading", { name: /The Blog Engine/i }),
      ).toBeVisible();
      await page.getByRole("link", { name: /Explore Features/i }).click();
      await expect(
        page.getByRole("heading", { name: /Create Amazing Content/i }),
      ).toBeVisible();

      await page.getByRole("link", { name: /Docs/i }).first().click();
      await expect(
        page.getByRole("heading", { name: "Documentation" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Quick Start" }).click();
      await expect(
        page.getByRole("heading", { name: "Quick Start" }),
      ).toBeVisible();

      await page.getByRole("link", { name: /Examples/i }).click();
      await expect(
        page.getByRole("heading", { name: /Reference experiences/i }),
      ).toBeVisible();

      await page.getByRole("link", { name: /Blog/i }).first().click();
      await expect(page.getByRole("heading", { name: "Pulse Blog" })).toBeVisible();
      await page.getByRole("link", { name: /Introducing Pulse/i }).first().click();
      await expect(
        page.getByRole("heading", {
          name: /Introducing Pulse: The Blog Engine That Comes Alive/i,
        }),
      ).toBeVisible();
    });
  });

  test("supports the interactive demo flow on the built site", async ({ page }) => {
    await withWebsiteServer(async (url) => {
      await page.goto(`${url}/demo/`);

      await expect(page.getByRole("heading", { name: "Pulse Demo" })).toBeVisible();
      await page.getByRole("button", { name: /Click to add a block/i }).click();
      await page.getByPlaceholder("Type a command or search...").fill("Heading 2");
      await page.getByRole("button", { name: /Heading 2/i }).click();

      await expect(page.getByText("Subheading")).toBeVisible();
      await expect(page.getByText("3 blocks")).toBeVisible();
    });
  });
});
