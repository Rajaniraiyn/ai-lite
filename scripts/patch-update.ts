import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { ensureCleanRepo, run } from "./lib/git.ts";
import { listPatches, resolvePatch } from "./lib/patches.ts";

const { args, positionals } = parseCli({
  string: ["patch"],
});

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

ensureCleanRepo(repoDir);

const patches = listPatches(patchesDir);
if (patches.length === 0) {
  throw new Error("No patches found.");
}

const targetArg = String(args.patch ?? positionals[0] ?? "").trim();
if (!targetArg) {
  throw new Error("Provide --patch <number|name|file>.");
}

const target = resolvePatch(patches, targetArg);
const targetIndex = patches.findIndex((patch) => patch.number === target.number);

run(`git checkout -B ${cfg.branch} ${cfg.commit}`, { cwd: repoDir });
run("git reset --hard", { cwd: repoDir });
run("git clean -fd", { cwd: repoDir });

for (const patch of patches.slice(0, targetIndex)) {
  run(`git am -3 --whitespace=nowarn "${patch.absPath}"`, { cwd: repoDir });
  console.log(`Applied ${patch.file}`);
}

try {
  run(`git am -3 --whitespace=nowarn "${target.absPath}"`, { cwd: repoDir });
  run("git reset --mixed HEAD~1", { cwd: repoDir });
  console.log(`Ready to edit ${target.file}. After editing, run patch:update-finish --patch ${target.number}.`);
} catch (error) {
  console.error(`Failed applying ${target.file}. Resolve conflicts, then re-run patch:update if needed.`);
  throw error;
}
