#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";

const backlogPath = path.resolve(process.cwd(), "backlog/BACKLOG.md");
const text = readFileSync(backlogPath, "utf8");
const lines = text.split(/\r?\n/);

const completedTaskLines = [];

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (/^\s*-\s*✅\s+/.test(line)) {
    completedTaskLines.push({ lineNumber: index + 1, line });
  }
}

if (completedTaskLines.length > 0) {
  console.error("Backlog hygiene check failed:");
  console.error("Completed checklist items (✅) are not allowed in backlog/BACKLOG.md.");
  for (const entry of completedTaskLines) {
    console.error(`  line ${entry.lineNumber}: ${entry.line}`);
  }
  console.error("Move completed items into backlog/DONE.md.");
  process.exit(1);
}

if (!text.includes("## 🔮 Future Roadmap (Not Active Yet)")) {
  console.error("Backlog hygiene check failed:");
  console.error('Missing required section heading: "## 🔮 Future Roadmap (Not Active Yet)".');
  process.exit(1);
}

console.log("Backlog hygiene check passed.");
