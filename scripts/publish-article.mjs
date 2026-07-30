#!/usr/bin/env node
/**
 * publish-article.mjs — push a locally-drafted article JSON file to the
 * Dr Hayat content API (POST /api/cms/publish-article).
 *
 * Usage:
 *   node scripts/publish-article.mjs <file.json> [--target local|prod] [--token <t>] [--dry-run]
 *
 *   <file.json>          Article JSON (see docs/ARTICLE_WORKFLOW.md for the shape).
 *   --target local|prod  local → http://localhost:3000 (default)
 *                        prod  → $PROD_SITE_URL (must be set)
 *   --token <t>          API token. Falls back to $CONTENT_API_TOKEN.
 *   --dry-run            Validate + report payload size only; no HTTP request.
 *
 * Exit codes: 0 success (or successful dry-run), 1 any failure.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const API_PATH = "/api/cms/publish-article";
const LOCAL_BASE = "http://localhost:3000";
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ── args ─────────────────────────────────────────────────────────────── */
function usage(message) {
  if (message) console.error(`✗ ${message}`);
  console.error(
    `Usage: node scripts/publish-article.mjs <file.json> [--target local|prod] [--token <t>] [--dry-run]`,
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = { file: null, target: "local", token: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target") {
      args.target = argv[++i] ?? "";
      if (args.target !== "local" && args.target !== "prod")
        usage(`--target must be "local" or "prod", got "${args.target}"`);
    } else if (arg === "--token") {
      args.token = argv[++i] ?? null;
      if (!args.token) usage("--token requires a value");
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg.startsWith("--")) {
      usage(`unknown flag ${arg}`);
    } else if (!args.file) {
      args.file = arg;
    } else {
      usage(`unexpected extra argument "${arg}"`);
    }
  }
  if (!args.file) usage("missing <file.json>");
  return args;
}

/* ── zod-free sanity check (mirror of the server-side schema) ────────── */
function sanityCheck(article) {
  const errors = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (!isObj(article)) return ["file must contain a single JSON object"];
  if (
    typeof article.title !== "string" ||
    article.title.length < 3 ||
    article.title.length > 200
  ) {
    errors.push("title: string of 3..200 chars required");
  }
  if (
    article.slug !== undefined &&
    (typeof article.slug !== "string" || !SLUG_REGEX.test(article.slug))
  ) {
    errors.push('slug: must be kebab-case (a-z, 0-9, hyphens), e.g. "vitamin-d-guide"');
  }
  if (
    article.excerpt !== undefined &&
    (typeof article.excerpt !== "string" || article.excerpt.length > 500)
  ) {
    errors.push("excerpt: string of at most 500 chars");
  }
  if (article.tags !== undefined) {
    if (
      !Array.isArray(article.tags) ||
      article.tags.length > 6 ||
      !article.tags.every((t) => typeof t === "string" && t.length > 0)
    ) {
      errors.push("tags: array of up to 6 non-empty strings");
    }
  }
  if (article.coverImage !== undefined) {
    const c = article.coverImage;
    if (
      typeof c !== "string" ||
      !(c.startsWith("/assets/") || c.startsWith("https://"))
    ) {
      errors.push("coverImage: path under /assets/ or an https URL");
    }
  }
  if (
    article.status !== undefined &&
    article.status !== "draft" &&
    article.status !== "published"
  ) {
    errors.push('status: "draft" or "published"');
  }
  if (
    article.publishedAt !== undefined &&
    (typeof article.publishedAt !== "string" ||
      Number.isNaN(Date.parse(article.publishedAt)))
  ) {
    errors.push("publishedAt: ISO datetime string, e.g. 2026-07-27T09:00:00.000Z");
  }
  if (
    !Array.isArray(article.blocks) ||
    article.blocks.length < 1 ||
    article.blocks.length > 200
  ) {
    errors.push("blocks: array of 1..200 block objects required");
  } else {
    article.blocks.forEach((block, i) => {
      if (!isObj(block)) {
        errors.push(`blocks[${i}]: must be an object`);
        return;
      }
      if (typeof block.type !== "string" || block.type.length === 0)
        errors.push(`blocks[${i}].type: non-empty string required`);
      if (block.data !== undefined && !isObj(block.data))
        errors.push(`blocks[${i}].data: must be an object`);
    });
  }
  return errors;
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/* ── main ─────────────────────────────────────────────────────────────── */
const args = parseArgs(process.argv.slice(2));

let article;
try {
  article = JSON.parse(readFileSync(path.resolve(args.file), "utf8"));
} catch (err) {
  console.error(`✗ cannot read/parse ${args.file}: ${err.message}`);
  process.exit(1);
}

const errors = sanityCheck(article);
if (errors.length > 0) {
  console.error(`✗ ${args.file} failed the sanity check:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const slug = article.slug ?? slugifyTitle(article.title);
const payload = JSON.stringify(article);
const payloadBytes = Buffer.byteLength(payload, "utf8");
const kb = (payloadBytes / 1024).toFixed(1);

console.log(`✓ sanity check passed`);
console.log(`  title   : ${article.title}`);
console.log(
  `  slug    : ${slug || "— (server will reject: Persian titles need an explicit slug)"}`,
);
console.log(`  status  : ${article.status ?? "draft"}`);
console.log(`  blocks  : ${article.blocks.length}`);
console.log(`  tags    : ${(article.tags ?? []).join("، ") || "—"}`);
console.log(`  payload : ${payloadBytes} bytes (${kb} KB)`);

if (args.dryRun) {
  console.log(`\n--dry-run: nothing sent.`);
  process.exit(0);
}

const token = args.token ?? process.env.CONTENT_API_TOKEN;
if (!token) {
  console.error("✗ no API token: pass --token <t> or set CONTENT_API_TOKEN");
  process.exit(1);
}

let url;
if (args.target === "prod") {
  const base = process.env.PROD_SITE_URL;
  if (!base) {
    console.error("✗ --target prod needs PROD_SITE_URL set (e.g. https://drhayat.ir)");
    process.exit(1);
  }
  url = new URL(API_PATH, base).toString();
} else {
  url = `${LOCAL_BASE}${API_PATH}`;
}

console.log(`\n→ POST ${url}  (target: ${args.target})`);

let res;
try {
  // redirect: "follow" — the app uses trailingSlash, POST /x 308 → /x/.
  res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: payload,
    redirect: "follow",
  });
} catch (err) {
  console.error(`✗ request failed: ${err.message}`);
  if (args.target === "local")
    console.error("  is the dev server running? (cd apps/website && npm run dev)");
  process.exit(1);
}

let json = null;
const text = await res.text();
try {
  json = JSON.parse(text);
} catch {
  /* non-JSON response */
}

if (res.ok && json?.status === "ok") {
  const base =
    args.target === "prod" ? process.env.PROD_SITE_URL.replace(/\/$/, "") : LOCAL_BASE;
  const verb = json.action === "created" ? "✓ created" : "↺ updated";
  console.log(`${verb}  ${json.slug}`);
  console.log(`  id  : ${json.id}`);
  console.log(`  url : ${base}${json.url}/`);
  if (json.action === "created" && (article.status ?? "draft") === "draft") {
    console.log(
      `  note: status is "draft" — not visible on the public blog until published.`,
    );
  }
  process.exit(0);
}

console.error(`✗ HTTP ${res.status}`);
if (json) {
  console.error(`  error: ${json.error ?? "(unknown)"}`);
  if (json.message) console.error(`  message: ${json.message}`);
  if (Array.isArray(json.details)) {
    for (const d of json.details) {
      console.error(
        `  - ${typeof d === "string" ? d : `block ${d.blockIndex} (${d.blockType}): ${d.message}`}`,
      );
    }
  }
} else {
  console.error(`  body: ${text.slice(0, 500)}`);
}
process.exit(1);
