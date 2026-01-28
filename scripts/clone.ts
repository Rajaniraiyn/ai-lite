import fs from "node:fs";
import path from "node:path";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { run } from "./lib/git.ts";

const { args } = parseCli({
  boolean: ["full"],
  string: ["depth", "filter"],
});

const cfg = getConfig();
const { rootDir, repoDir } = getPaths(cfg);

const depth = String(args.depth ?? "1").trim();
const filter = String(args.filter ?? "blob:none").trim();
const full = Boolean(args.full);

if (!fs.existsSync(repoDir)) {
  if (full) {
    run(`git clone ${cfg.repo} ${cfg.dir}`, { cwd: rootDir });
  } else {
    run(
      `git clone --filter=${filter} --no-checkout --depth=${depth} ${cfg.repo} ${cfg.dir}`,
      { cwd: rootDir },
    );
  }
}

if (!full) {
  run(`git fetch --depth=${depth} origin ${cfg.commit}`, { cwd: repoDir });
} else {
  run("git fetch --all --tags", { cwd: repoDir });
}

run(`git checkout -B ${cfg.branch} ${cfg.commit}`, { cwd: repoDir });

console.log(`Checked out ${cfg.repo} at ${cfg.commit} in ${path.relative(rootDir, repoDir)}.`);
