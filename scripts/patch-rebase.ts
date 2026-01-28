import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { run, runCapture } from "./lib/git.ts";
import { listPatches } from "./lib/patches.ts";

const { args } = parseCli({
  boolean: ["rewrite"],
  alias: { r: "rewrite" },
  defaults: { rewrite: true },
});

const cfg = getConfig();
const { repoDir, patchesDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

const patches = listPatches(patchesDir);
if (patches.length === 0) {
  console.log("No patches to rebase.");
  process.exit(0);
}

run(`git checkout -B ${cfg.branch} ${cfg.commit}`, { cwd: repoDir });
run("git reset --hard", { cwd: repoDir });
run("git clean -fd", { cwd: repoDir });

for (const patch of patches) {
  try {
    run(`git am -3 --whitespace=nowarn "${patch.absPath}"`, { cwd: repoDir });
    console.log(`Applied ${patch.file}`);
  } catch (error) {
    console.error(`Failed applying ${patch.file}. Resolve conflicts then re-run patch:rebase.`);
    throw error;
  }
}

if (!args.rewrite) {
  console.log("Rebase finished without rewriting patches.");
  process.exit(0);
}

const commitsRaw = runCapture(`git rev-list --reverse ${cfg.commit}..HEAD`, {
  cwd: repoDir,
}).trim();
const commits = commitsRaw ? commitsRaw.split("\n") : [];

if (commits.length !== patches.length) {
  throw new Error(
    `Commit count (${commits.length}) does not match patch count (${patches.length}).`,
  );
}

for (let i = 0; i < patches.length; i += 1) {
  const patch = patches[i];
  const commit = commits[i];
  const data = runCapture(`git format-patch -1 --stdout ${commit}`, {
    cwd: repoDir,
  });
  fs.writeFileSync(patch.absPath, data, "utf8");
  console.log(`Rewrote ${patch.file}`);
}
