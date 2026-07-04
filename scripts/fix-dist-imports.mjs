import { readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      yield fullPath;
    }
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRelativeImport(baseDir, importPath) {
  const asFile = path.join(baseDir, `${importPath}.js`);
  if (await exists(asFile)) {
    return `${importPath}.js`;
  }

  const asIndex = path.join(baseDir, importPath, "index.js");
  if (await exists(asIndex)) {
    return `${importPath}/index.js`;
  }

  return importPath;
}

async function patchFile(filePath) {
  const baseDir = path.dirname(filePath);
  const original = await readFile(filePath, "utf8");

  const matches = [...original.matchAll(
    /((?:import|export)\s+(?:[^'"]*?)\s*from\s+['"]|import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"])/g,
  )];

  if (matches.length === 0) {
    return false;
  }

  let updated = original;
  // Process from end to start so replacements don't shift indices.
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const importPath = match[2];
    if (/\.[a-zA-Z0-9]+$/.test(importPath)) {
      continue;
    }

    const resolved = await resolveRelativeImport(baseDir, importPath);
    if (resolved !== importPath) {
      const start = match.index + match[1].length;
      const end = start + importPath.length;
      updated = updated.slice(0, start) + resolved + updated.slice(end);
    }
  }

  if (updated !== original) {
    await writeFile(filePath, updated, "utf8");
    return true;
  }

  return false;
}

async function main() {
  let patched = 0;
  for await (const filePath of walk(DIST_DIR)) {
    if (await patchFile(filePath)) {
      patched += 1;
    }
  }
  console.log(`[fix-dist-imports] patched ${patched} file(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
