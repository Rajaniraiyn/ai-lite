import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { ensureCleanRepo, run } from "./lib/git.ts";
import { listPatches, resolvePatch } from "./lib/patches.ts";

const { args } = parseCli({
  string: ["until"],
});

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

ensureCleanRepo(repoDir);

const patches = listPatches(patchesDir);
if (patches.length === 0) {
  console.log("No patches to apply.");
  process.exit(0);
}

let limit = patches.length;
if (args.until) {
  const target = resolvePatch(patches, String(args.until));
  limit = patches.findIndex((patch) => patch.number === target.number) + 1;
}

for (const patch of patches.slice(0, limit)) {
  try {
    run(`git am -3 --whitespace=nowarn "${patch.absPath}"`, { cwd: repoDir });
    console.log(`Applied ${patch.file}`);
  } catch (error) {
    console.error(`Failed applying ${patch.file}. Resolve conflicts and run "git am --continue" or abort with "git am --abort".`);
    throw error;
  }
}
