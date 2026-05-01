import { createServer } from "node:http";

import { expect, test } from "@playwright/test";

const FIXTURE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pulse E2E Fixture</title>
    <style>
      body { font-family: sans-serif; margin: 1rem; }
      .row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
      button { cursor: pointer; }
      #workflow-status { margin-top: 0.5rem; color: #1a4; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <h1>Pulse E2E Fixture</h1>
    <div class="row">
      <input id="block-input" placeholder="Block text" />
      <button id="add-block">Add block</button>
      <button id="remove-last">Remove last</button>
    </div>
    <div class="row">
      <button id="undo">Undo</button>
      <button id="redo">Redo</button>
      <button id="save">Save</button>
      <button id="load">Load</button>
      <button id="clear">Clear</button>
      <button id="install-plugin">Install plugin</button>
    </div>
    <div id="workflow-status"></div>
    <div>Block count: <strong id="block-count">0</strong></div>
    <ul id="block-list"></ul>
    <script>
      (function () {
        const STORAGE_KEY = "pulse:e2e-workflow";
        const state = {
          blocks: [],
          history: [],
          historyIndex: -1,
          pluginInstalled: false,
          nextId: 1,
        };

        const input = document.getElementById("block-input");
        const count = document.getElementById("block-count");
        const list = document.getElementById("block-list");
        const status = document.getElementById("workflow-status");

        function snapshot() {
          return JSON.parse(JSON.stringify(state.blocks));
        }

        function writeStatus(message) {
          status.textContent = message;
        }

        function pushHistory() {
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot());
          state.historyIndex = state.history.length - 1;
        }

        function setBlocks(blocks) {
          state.blocks = blocks;
          render();
        }

        function render() {
          count.textContent = String(state.blocks.length);
          list.innerHTML = state.blocks
            .map((block) => "<li data-id=\\"" + block.id + "\\">" + block.text + "</li>")
            .join("");
        }

        function addBlock() {
          const text = input.value.trim();
          if (!text) {
            writeStatus("Enter block text first");
            return;
          }

          const normalizedText = state.pluginInstalled ? "[plugin] " + text : text;
          state.blocks.push({
            id: "b-" + state.nextId++,
            text: normalizedText,
          });
          pushHistory();
          render();
          input.value = "";
          writeStatus("Block added");
        }

        function removeLast() {
          if (state.blocks.length === 0) {
            writeStatus("No blocks to remove");
            return;
          }

          state.blocks.pop();
          pushHistory();
          render();
          writeStatus("Last block removed");
        }

        function undo() {
          if (state.historyIndex <= 0) {
            writeStatus("Nothing to undo");
            return;
          }

          state.historyIndex -= 1;
          setBlocks(JSON.parse(JSON.stringify(state.history[state.historyIndex])));
          writeStatus("Undo applied");
        }

        function redo() {
          if (state.historyIndex >= state.history.length - 1) {
            writeStatus("Nothing to redo");
            return;
          }

          state.historyIndex += 1;
          setBlocks(JSON.parse(JSON.stringify(state.history[state.historyIndex])));
          writeStatus("Redo applied");
        }

        function save() {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.blocks));
          writeStatus("Saved");
        }

        function load() {
          const value = localStorage.getItem(STORAGE_KEY);
          const blocks = value ? JSON.parse(value) : [];
          setBlocks(blocks);
          pushHistory();
          writeStatus("Loaded");
        }

        function clear() {
          setBlocks([]);
          pushHistory();
          writeStatus("Cleared");
        }

        function installPlugin() {
          state.pluginInstalled = true;
          writeStatus("Plugin installed");
        }

        document.getElementById("add-block").addEventListener("click", addBlock);
        document.getElementById("remove-last").addEventListener("click", removeLast);
        document.getElementById("undo").addEventListener("click", undo);
        document.getElementById("redo").addEventListener("click", redo);
        document.getElementById("save").addEventListener("click", save);
        document.getElementById("load").addEventListener("click", load);
        document.getElementById("clear").addEventListener("click", clear);
        document.getElementById("install-plugin").addEventListener("click", installPlugin);

        pushHistory();
        render();
      })();
    </script>
  </body>
</html>`;

async function withFixtureServer(
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((_, response) => {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(FIXTURE_HTML);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to start fixture server");
  }

  const fixtureUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(fixtureUrl);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

test.describe("Pulse basic workflows", () => {
  test.skip(
    process.env.PULSE_E2E_BROWSER_READY !== "1",
    "No local cached browser runtime is available for E2E execution",
  );

  test("create -> save -> clear -> load document blocks", async ({ page }) => {
    await withFixtureServer(async (url) => {
      await page.goto(url);

      await page.fill("#block-input", "First block");
      await page.click("#add-block");
      await page.fill("#block-input", "Second block");
      await page.click("#add-block");

      await expect(page.locator("#block-count")).toHaveText("2");

      await page.click("#save");
      await page.click("#clear");
      await expect(page.locator("#block-count")).toHaveText("0");

      await page.click("#load");
      await expect(page.locator("#block-count")).toHaveText("2");
      await expect(page.locator("#block-list li").nth(0)).toHaveText("First block");
      await expect(page.locator("#block-list li").nth(1)).toHaveText("Second block");
    });
  });

  test("undo and redo mutate block history correctly", async ({ page }) => {
    await withFixtureServer(async (url) => {
      await page.goto(url);

      await page.fill("#block-input", "A");
      await page.click("#add-block");
      await page.fill("#block-input", "B");
      await page.click("#add-block");
      await page.click("#remove-last");
      await expect(page.locator("#block-count")).toHaveText("1");

      await page.click("#undo");
      await expect(page.locator("#block-count")).toHaveText("2");
      await page.click("#redo");
      await expect(page.locator("#block-count")).toHaveText("1");
    });
  });

  test("plugin installation affects block insertion behavior", async ({ page }) => {
    await withFixtureServer(async (url) => {
      await page.goto(url);

      await page.click("#install-plugin");
      await page.fill("#block-input", "Plugin block");
      await page.click("#add-block");

      await expect(page.locator("#block-list li")).toHaveCount(1);
      await expect(page.locator("#block-list li").first()).toHaveText(
        "[plugin] Plugin block",
      );
    });
  });
});
