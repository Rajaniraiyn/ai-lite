import fs from "node:fs";
import path from "node:path";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { prompt } from "./lib/prompt.ts";
import { run, runCapture } from "./lib/git.ts";
import { listPatches, resolvePatch, slugify } from "./lib/patches.ts";

const { args, positionals } = parseCli({
  string: ["patch", "name"],
});

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

const patches = listPatches(patchesDir);
if (patches.length === 0) {
  throw new Error("No patches found.");
}

const targetArg = String(args.patch ?? positionals[0] ?? "").trim();
if (!targetArg) {
  throw new Error("Provide --patch <number|name|file>.");
}

const target = resolvePatch(patches, targetArg);

const status = runCapture("git status --porcelain", { cwd: repoDir }).trim();
if (!status) {
  throw new Error("No changes to record.");
}

let name = String(args.name ?? "").trim();
if (!name && process.stdin.isTTY) {
  const answer = await prompt(`Patch name (blank keeps "${target.name}"): `);
  name = answer.trim();
}
if (!name) {
  name = target.name;
}

const slug = slugify(name);
if (!slug) {
  throw new Error("Patch name produced an empty slug.");
}

run("git add -A", { cwd: repoDir });
run(`git commit -m "patch: ${name}"`, { cwd: repoDir });

const patchData = runCapture("git format-patch -1 --stdout HEAD", { cwd: repoDir });
const nextFile = `${target.number}_${slug}.patch`;
const nextPath = path.join(patchesDir, nextFile);

if (target.file !== nextFile) {
  fs.rmSync(target.absPath, { force: true });
}

fs.writeFileSync(nextPath, patchData, "utf8");
console.log(`Updated ${nextFile}`);
