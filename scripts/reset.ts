import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { confirm } from "./lib/prompt.ts";
import { run } from "./lib/git.ts";

const { args } = parseCli({
  boolean: ["yes"],
  alias: { y: "yes" },
});

const cfg = getConfig();
const { repoDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

if (!args.yes && process.stdin.isTTY) {
  const ok = await confirm(
    `This will discard all changes in ${cfg.dir}. Continue?`,
  );
  if (!ok) {
    process.exit(1);
  }
}

run(`git checkout -B ${cfg.branch} ${cfg.commit}`, { cwd: repoDir });
run("git reset --hard", { cwd: repoDir });
run("git clean -fd", { cwd: repoDir });

console.log(`Reset ${cfg.dir} to ${cfg.commit}.`);
