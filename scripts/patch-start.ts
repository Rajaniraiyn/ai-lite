import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { ensureCleanRepo, run } from "./lib/git.ts";
import { listPatches } from "./lib/patches.ts";

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

run(`git checkout -B ${cfg.branch} ${cfg.commit}`, { cwd: repoDir });
run("git reset --hard", { cwd: repoDir });
run("git clean -fd", { cwd: repoDir });
ensureCleanRepo(repoDir);

const patches = listPatches(patchesDir);
for (const patch of patches) {
  run(`git am -3 --whitespace=nowarn "${patch.absPath}"`, { cwd: repoDir });
  console.log(`Applied ${patch.file}`);
}

console.log("Patch workspace ready.");
