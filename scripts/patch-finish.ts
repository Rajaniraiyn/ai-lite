import fs from "node:fs";
import path from "node:path";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { prompt } from "./lib/prompt.ts";
import { run, runCapture } from "./lib/git.ts";
import { listPatches, nextPatchNumber, slugify } from "./lib/patches.ts";

const { args } = parseCli({
  string: ["name"],
});

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

const status = runCapture("git status --porcelain", { cwd: repoDir }).trim();
if (!status) {
  throw new Error("No changes to record.");
}

let name = String(args.name ?? "").trim();
if (!name && process.stdin.isTTY) {
  name = await prompt("Patch name: ");
}
if (!name) {
  throw new Error("Patch name is required.");
}

const patches = listPatches(patchesDir);
const number = nextPatchNumber(patches);
const slug = slugify(name);
if (!slug) {
  throw new Error("Patch name produced an empty slug.");
}

fs.mkdirSync(patchesDir, { recursive: true });

run("git add -A", { cwd: repoDir });
run(`git commit -m "patch: ${name}"`, { cwd: repoDir });

const patchData = runCapture("git format-patch -1 --stdout HEAD", { cwd: repoDir });
const fileName = `${number}_${slug}.patch`;
const patchPath = path.join(patchesDir, fileName);
fs.writeFileSync(patchPath, patchData, "utf8");

console.log(`Created ${fileName}`);
